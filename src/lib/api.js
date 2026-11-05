import { readDemoState, writeDemoState } from "../data/demoData";

const configuredApiUrl = import.meta.env.VITE_API_URL;
const sameOriginApi = configuredApiUrl === "/";
const API_URL = (
  sameOriginApi
    ? ""
    : configuredApiUrl || (import.meta.env.DEV ? "http://localhost:4000" : "")
).replace(/\/$/, "");
const demoFlag = import.meta.env.VITE_DEMO_MODE;
// Demo storage is available only when explicitly enabled in development.
export const demoMode = import.meta.env.DEV && demoFlag === "true";
const demoPasswordIterations = 100_000;

function encodeBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

async function hashDemoPassword(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: demoPasswordIterations },
    key,
    256,
  );
  return { salt: encodeBase64(salt), passwordHash: encodeBase64(new Uint8Array(hash)) };
}

async function matchesDemoPassword(password, account) {
  const salt = Uint8Array.from(atob(account.salt), (character) => character.charCodeAt(0));
  const { passwordHash } = await hashDemoPassword(password, salt);
  return passwordHash === account.passwordHash;
}

async function request(path, options = {}) {
  if (!API_URL && !sameOriginApi) {
    throw new Error(
      "The production API is not configured. Set VITE_API_URL to / for a same-origin API or to the live HTTPS API origin, then rebuild the frontend.",
    );
  }
  const response = await fetch(API_URL + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(body.message || "Something went wrong. Please try again.");
  return body;
}

function persistDemo(update) {
  const state = { ...readDemoState(), ...update };
  writeDemoState(state);
  return state;
}

export const api = {
  async me() {
    if (demoMode) return readDemoState().user;
    try {
      return (await request("/api/auth/me")).user;
    } catch {
      return null;
    }
  },
  async login(email, password) {
    if (demoMode) {
      const normalizedEmail = email.trim().toLowerCase();
      const pendingVerification = readDemoState().pendingVerification;
      if (pendingVerification?.email === normalizedEmail) {
        throw new Error(
          "Please verify your email before signing in. Request a verification code to continue.",
        );
      }
      const ownerEmail = (
        import.meta.env.VITE_ADMIN_EMAIL || "owner@seasoned.com"
      )
        .trim()
        .toLowerCase();
      const state = readDemoState();
      const previousUser = state.user;
      const isOwner = normalizedEmail === ownerEmail;
      if (isOwner && password !== "demo1234") {
        throw new Error("Email or password is incorrect.");
      }
      const account = state.accounts.find((item) => item.email === normalizedEmail);
      if (!isOwner && !account) {
        throw new Error("No account found. Please create an account before signing in.");
      }
      if (!isOwner && !(await matchesDemoPassword(password, account))) {
        throw new Error("Email or password is incorrect.");
      }
      const user = isOwner
        ? {
            id: "demo-admin",
            name:
              previousUser?.email === normalizedEmail
                ? previousUser.name
                : "Alex Morgan",
            email: normalizedEmail,
            role: "admin",
          }
        : {
            id: "demo-customer-" + normalizedEmail,
            name:
              previousUser?.email === normalizedEmail
                ? previousUser.name
                : normalizedEmail.split("@")[0],
            email: normalizedEmail,
            role: "customer",
          };
      persistDemo({ user });
      return user;
    }
    return (
      await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
    ).user;
  },
  async forgotPassword(email) {
    if (demoMode)
      return { message: 'Demo preview: email verification is skipped. Set a new password for this browser session.', demoPreview: true };
    return request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  async resetPassword({ email, code, password }) {
    if (demoMode) {
      const normalizedEmail = email.trim().toLowerCase();
      const state = readDemoState();
      const accountIndex = state.accounts.findIndex((item) => item.email === normalizedEmail);
      if (accountIndex === -1) {
        throw new Error("No registered account found. Create an account before resetting your password.");
      }
      const credentials = await hashDemoPassword(password);
      const accounts = [...state.accounts];
      accounts[accountIndex] = { ...accounts[accountIndex], ...credentials };
      persistDemo({ accounts });
      return { message: 'Demo password updated for this browser session. Sign in with your new password.' };
    }
    return request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, password }),
    });
  },
  async register(name, email, password) {
    if (demoMode) {
      const normalizedEmail = email.trim().toLowerCase();
      const state = readDemoState();
      const ownerEmail = (import.meta.env.VITE_ADMIN_EMAIL || "owner@seasoned.com").trim().toLowerCase();
      if (normalizedEmail === ownerEmail || state.accounts.some((account) => account.email === normalizedEmail)) {
        throw new Error("An account with this email already exists. Please sign in instead.");
      }
      const credentials = await hashDemoPassword(password);
      const user = {
        id: "demo-customer-" + normalizedEmail,
        name: name.trim(),
        email: normalizedEmail,
        role: "customer",
        emailVerified: true,
      };
      persistDemo({
        user,
        pendingVerification: null,
        accounts: [
          ...state.accounts,
          { id: user.id, name: user.name, email: user.email, ...credentials },
        ],
      });
      return { user };
    }
    return request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },
  async verifyEmail(email, code) {
    const normalizedEmail = email.trim().toLowerCase();
    if (demoMode) {
      const state = readDemoState();
      const pending = state.pendingVerification;
      if (
        !pending ||
        pending.email !== normalizedEmail ||
        pending.code !== code.trim() ||
        !pending.salt ||
        !pending.passwordHash
      ) {
        throw new Error("That verification code is incorrect or expired.");
      }
      const user = {
        id: "demo-customer-" + normalizedEmail,
        name: pending.name,
        email: pending.email,
        role: "customer",
        emailVerified: true,
      };
      persistDemo({
        user,
        pendingVerification: null,
        accounts: [
          ...state.accounts.filter((account) => account.email !== normalizedEmail),
          { id: user.id, name: user.name, email: user.email, salt: pending.salt, passwordHash: pending.passwordHash },
        ],
      });
      return user;
    }
    return (
      await request("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail, code }),
      })
    ).user;
  },
  async resendVerification(email) {
    const normalizedEmail = email.trim().toLowerCase();
    if (demoMode) {
      const pending = readDemoState().pendingVerification;
      if (!pending || pending.email !== normalizedEmail)
        throw new Error(
          "There is no pending email verification for that address.",
        );
      return { message: "Preview code is ready.", previewCode: pending.code };
    }
    return request("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail }),
    });
  },
  async logout() {
    if (demoMode) {
      persistDemo({ user: null });
      return;
    }
    await request("/api/auth/logout", { method: "POST" });
  },
  async updateProfile(name, avatar) {
    if (demoMode) {
      const currentUser = readDemoState().user;
      if (!currentUser)
        throw new Error("Please sign in to update your profile.");
      const user = { ...currentUser, name: name.trim(), avatar };
      persistDemo({ user });
      return user;
    }
    return (
      await request("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, avatar }),
      })
    ).user;
  },
  async menu(manage = false) {
    if (demoMode) return readDemoState().menu;
    return (await request("/api/menu" + (manage ? "?manage=true" : ""))).items;
  },
  async createBooking(values) {
    if (demoMode) {
      const state = readDemoState();
      const booking = {
        ...values,
        email: values.email.trim().toLowerCase(),
        orderItems: (values.foodItems || []).flatMap(
          ({ menuItemId, quantity }) => {
            const item = state.menu.find(
              (entry) => entry.id === menuItemId && entry.isAvailable,
            );
            return item
              ? [
                  {
                    menuItemId: item.id,
                    name: item.name,
                    quantity,
                    unitPrice: Number(item.price),
                  },
                ]
              : [];
          },
        ),
        id: "b" + Date.now(),
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      delete booking.foodItems;
      booking.orderTotal = booking.orderItems.reduce(
        (total, item) => total + item.unitPrice * item.quantity,
        0,
      );
      persistDemo({ bookings: [booking, ...state.bookings] });
      return booking;
    }
    return (
      await request("/api/bookings", {
        method: "POST",
        body: JSON.stringify(values),
      })
    ).booking;
  },
  async bookings() {
    if (demoMode) return readDemoState().bookings;
    return (await request("/api/bookings")).bookings;
  },
  async myBookings() {
    if (demoMode) {
      const user = readDemoState().user;
      return user
        ? readDemoState().bookings.filter(
            (booking) => booking.email === user.email,
          )
        : [];
    }
    return (await request("/api/bookings/mine")).bookings;
  },
  async updateMyBooking(id, values) {
    if (demoMode) {
      const state = readDemoState();
      const user = state.user;
      const booking = state.bookings.find(
        (item) =>
          item.id === id &&
          item.email?.toLowerCase() === user?.email?.toLowerCase(),
      );
      if (!booking) throw new Error("Reservation not found.");
      if (booking.status === "cancelled")
        throw new Error("Cancelled reservations cannot be edited.");
      if (values.date < new Date().toISOString().slice(0, 10))
        throw new Error("Please choose a future date.");
      const updated = { ...booking, ...values, status: "pending" };
      const bookings = state.bookings.map((item) =>
        item.id === id ? updated : item,
      );
      persistDemo({ bookings });
      return updated;
    }
    return (
      await request("/api/bookings/mine/" + id, {
        method: "PATCH",
        body: JSON.stringify(values),
      })
    ).booking;
  },
  async deleteMyBooking(id) {
    if (demoMode) {
      const state = readDemoState();
      const user = state.user;
      const booking = state.bookings.find(
        (item) =>
          item.id === id &&
          item.email?.toLowerCase() === user?.email?.toLowerCase(),
      );
      if (!booking) throw new Error("Reservation not found.");
      persistDemo({
        bookings: state.bookings.filter((item) => item.id !== id),
      });
      return { message: "Reservation deleted." };
    }
    return request("/api/bookings/mine/" + id, { method: "DELETE" });
  },
  async updateBooking(id, status) {
    if (demoMode) {
      const state = readDemoState();
      const bookings = state.bookings.map((item) =>
        item.id === id ? { ...item, status } : item,
      );
      persistDemo({ bookings });
      return bookings.find((item) => item.id === id);
    }
    return (
      await request("/api/bookings/" + id + "/status", {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
    ).booking;
  },
  async saveMenuItem(item) {
    if (demoMode) {
      const state = readDemoState();
      const exists = state.menu.some((entry) => entry.id === item.id);
      const menu = exists
        ? state.menu.map((entry) => (entry.id === item.id ? item : entry))
        : [{ ...item, id: "m" + Date.now() }, ...state.menu];
      persistDemo({ menu });
      return menu;
    }
    const result = item.id
      ? await request("/api/menu/" + item.id, {
          method: "PUT",
          body: JSON.stringify(item),
        })
      : await request("/api/menu", {
          method: "POST",
          body: JSON.stringify(item),
        });
    return result.items;
  },
  async uploadMenuImage(file) {
    if (demoMode) {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () =>
          reject(new Error("The selected image could not be read."));
        reader.readAsDataURL(file);
      });
    }
    const response = await fetch(API_URL + "/api/menu/images", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(body.message || "The image could not be uploaded.");
    return body.image;
  },
  async deleteMenuItem(id) {
    if (demoMode) {
      const menu = readDemoState().menu.filter((item) => item.id !== id);
      persistDemo({ menu });
      return menu;
    }
    return (await request("/api/menu/" + id, { method: "DELETE" })).items;
  },
  async settings() {
    if (demoMode) return readDemoState().settings;
    return (await request("/api/settings")).settings;
  },
  async updateSettings(settings) {
    if (demoMode) {
      persistDemo({ settings });
      return settings;
    }
    return (
      await request("/api/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      })
    ).settings;
  },
  async customers() {
    if (demoMode) {
      const emails = [
        ...new Set(readDemoState().bookings.map((booking) => booking.email)),
      ];
      return emails.map((email, index) => ({
        id: "c" + index,
        name: email.split("@")[0].replace(/[._]/g, " "),
        email,
      }));
    }
    return (await request("/api/users")).users;
  },
  async reports() {
    if (demoMode) {
      const bookings = readDemoState().bookings;
      return {
        total: bookings.length,
        pending: bookings.filter((item) => item.status === "pending").length,
        confirmed: bookings.filter((item) => item.status === "confirmed")
          .length,
        guests: bookings
          .filter((item) => item.status !== "cancelled")
          .reduce((sum, item) => sum + Number(item.guests || 0), 0),
        weekly: [12, 18, 15, 23, 19, 29, 25],
      };
    }
    return (await request("/api/reports/overview")).report;
  },
  oauthUrl() {
    return API_URL + "/api/auth/google";
  },
};
