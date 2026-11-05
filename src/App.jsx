import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { PublicLayout } from "./components/PublicLayout";
import { ReservationNotice } from "./components/ReservationNotice";
import Icon from "./components/Icon";
import { api, demoMode } from "./lib/api";
import { defaultSettings } from "./data/demoData";
import AdminPage from "./pages/AdminPage";
import { AboutPage } from "./pages/AboutPage";
import { AuthPage } from "./pages/AuthPage";
import { BookingPage } from "./pages/BookingPage";
import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/HomePage";
import { MenuPage } from "./pages/MenuPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { ProfilePage } from "./pages/ProfilePage";

function BookingDetails({ booking, onClose, onStatus }) {
  if (!booking) return null;
  const orderItems = booking.orderItems || [];
  const orderTotal =
    booking.orderTotal ??
    orderItems.reduce(
      (total, item) => total + Number(item.unitPrice) * item.quantity,
      0,
    );
  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="booking-detail-modal">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">RESERVATION DETAILS</span>
            <h2>{booking.customerName}</h2>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="booking-detail-grid">
          <div>
            <span className="eyebrow">DATE & TIME</span>
            <strong>
              {new Date(booking.date + "T12:00:00").toLocaleDateString(
                "en-US",
                { weekday: "long", month: "long", day: "numeric" },
              )}
              <br />
              {booking.time}
            </strong>
          </div>
          <div>
            <span className="eyebrow">PARTY SIZE</span>
            <strong>{booking.guests} guests</strong>
          </div>
          <div>
            <span className="eyebrow">PHONE</span>
            <strong>{booking.phone || "Not provided"}</strong>
          </div>
          <div>
            <span className="eyebrow">EMAIL</span>
            <strong>{booking.email}</strong>
          </div>
        </div>
        {booking.occasion && (
          <div className="detail-note">
            <span className="eyebrow">OCCASION</span>
            <p>{booking.occasion}</p>
          </div>
        )}
        {booking.specialRequests && (
          <div className="detail-note">
            <span className="eyebrow">GUEST NOTES</span>
            <p>{booking.specialRequests}</p>
          </div>
        )}
        {orderItems.length > 0 && (
          <div className="detail-note preorder-order">
            <span className="eyebrow">FOOD PRE-ORDER</span>
            <ul>
              {orderItems.map((item) => (
                <li key={item.menuItemId || item.name}>
                  <span>
                    {item.quantity} × {item.name}
                  </span>
                  <strong>
                    ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                  </strong>
                </li>
              ))}
            </ul>
            <p className="preorder-order-total">
              Estimated subtotal{" "}
              <strong>${Number(orderTotal).toFixed(2)}</strong>
            </p>
          </div>
        )}
        <div className="booking-detail-actions">
          {booking.status !== "confirmed" && (
            <button
              className="button button-dark"
              onClick={() => onStatus(booking.id, "confirmed")}
            >
              <Icon name="check" size={16} /> Confirm
            </button>
          )}
          {booking.status !== "cancelled" && (
            <button
              className="button button-outline"
              onClick={() => onStatus(booking.id, "cancelled")}
            >
              Cancel reservation
            </button>
          )}
          {booking.status === "confirmed" && (
            <button
              className="button button-outline"
              onClick={() => onStatus(booking.id, "pending")}
            >
              Mark as pending
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

const bookingStatusKey = (email) =>
  `seasoned.reservation-statuses:${(email || "").trim().toLowerCase()}`;
const readBookingStatuses = (email) => {
  try {
    const value = JSON.parse(
      window.localStorage.getItem(bookingStatusKey(email)) || "{}",
    );
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  } catch {
    return {};
  }
};
const writeBookingStatuses = (email, statuses) => {
  try {
    window.localStorage.setItem(
      bookingStatusKey(email),
      JSON.stringify(statuses),
    );
  } catch {
    // Reservation submission still succeeds when browser storage is unavailable.
  }
};

function App() {
  const [path, setPath] = useState(() => {
    const currentPath = window.location.pathname || "/";
    if (import.meta.env.DEV && currentPath === "/login") {
      window.history.replaceState({}, "", "/");
      return "/";
    }
    return currentPath;
  });
  const [user, setUser] = useState(null);
  const [menu, setMenu] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [report, setReport] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [ready, setReady] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [submittedBooking, setSubmittedBooking] = useState(null);
  const confirmedNoticeSeen = useRef(new Set());
  const [notice, setNotice] = useState("");

  const go = useCallback((url) => {
    window.history.pushState({}, "", url);
    setPath(url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname);
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const refresh = useCallback(async (admin = false) => {
    const [nextMenu, nextSettings] = await Promise.all([
      api.menu(admin),
      api.settings(),
    ]);
    setMenu(nextMenu);
    setSettings(nextSettings);
    if (admin) {
      const [nextBookings, nextCustomers, nextReport] = await Promise.all([
        api.bookings(),
        api.customers(),
        api.reports(),
      ]);
      setBookings(nextBookings);
      setCustomers(nextCustomers);
      setReport(nextReport);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([api.me(), api.menu(), api.settings()])
      .then(([currentUser, items, restaurant]) => {
        if (!active) return;
        setUser(currentUser);
        setMenu(items);
        setSettings(restaurant);
        setReady(true);
      })
      .catch((error) => {
        if (!active) return;
        setNotice(error.message);
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") return;
    refresh(true).catch((error) => setNotice(error.message));
  }, [user, refresh]);

  useEffect(() => {
    if (!user || user.role === "admin") return;
    let active = true;
    const checkMyBookings = async () => {
      try {
        const mine = await api.myBookings();
        if (!active) return;
        const statuses = readBookingStatuses(user.email);
        const recentlyCreated = (booking) => {
          const created = new Date(booking.createdAt || 0).getTime();
          return (
            Number.isFinite(created) &&
            Date.now() - created < 7 * 24 * 60 * 60 * 1000
          );
        };
        const newlyConfirmed = mine.find(
          (booking) =>
            booking.status === "confirmed" &&
            (statuses[booking.id] === "pending" ||
              (!statuses[booking.id] && recentlyCreated(booking))),
        );
        mine.forEach((booking) => {
          statuses[booking.id] = booking.status;
        });
        writeBookingStatuses(user.email, statuses);
        setBookings(mine);
        if (newlyConfirmed) {
          setConfirmedBooking((current) => {
            if (current || confirmedNoticeSeen.current.has(newlyConfirmed.id))
              return current;
            confirmedNoticeSeen.current.add(newlyConfirmed.id);
            return newlyConfirmed;
          });
        }
      } catch (error) {
        if (active && path === "/my-bookings")
          setNotice(error.message || "Could not refresh your reservations.");
      }
    };
    checkMyBookings();
    const interval = window.setInterval(checkMyBookings, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [path, user]);

  useEffect(() => {
    if (!ready) return;
    const needsAdmin = path.startsWith("/admin") && user?.role !== "admin";
    const needsAccount = ["/booking", "/my-bookings", "/profile"].includes(path) && !user;
    if (!needsAdmin && !needsAccount) return;
    if (needsAdmin && user)
      setNotice(
        "This page is for restaurant staff. Sign in with an administrator account to continue.",
      );
    if (needsAccount) {
      window.sessionStorage.setItem("dinenova.return-path", path);
      if (path === "/booking")
        setNotice("Please sign in or create an account to reserve a table.");
    }
    window.history.replaceState({}, "", "/login");
    setPath("/login");
  }, [path, user, ready]);

  const login = async (email, password) => {
    const nextUser = await api.login(email, password);
    setUser(nextUser);
    setNotice("");
    const returnPath = window.sessionStorage.getItem("dinenova.return-path");
    window.sessionStorage.removeItem("dinenova.return-path");
    go(nextUser.role === "admin" ? "/admin" : returnPath || "/");
  };
  const register = async (name, email, password) => {
    const result = await api.register(name, email, password);
    const nextUser = result.user;
    setUser(nextUser);
    setNotice(
      `Welcome to ${settings.restaurantName}, ${nextUser.name.split(" ")[0]}! Your account is ready.`,
    );
    const returnPath = window.sessionStorage.getItem("dinenova.return-path");
    window.sessionStorage.removeItem("dinenova.return-path");
    go(nextUser.role === "admin" ? "/admin" : returnPath || "/");
    return result;
  };
  const verifyEmail = async (email, code) => {
    const nextUser = await api.verifyEmail(email, code);
    setUser(nextUser);
    const returnPath = window.sessionStorage.getItem("dinenova.return-path");
    window.sessionStorage.removeItem("dinenova.return-path");
    setNotice(
      `Welcome to ${settings.restaurantName}, ${nextUser.name.split(" ")[0]}! Your account is ready.`,
    );
    go(returnPath || "/");
  };
  const resendVerification = async (email) => {
    return api.resendVerification(email);
  };
  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      setNotice(
        error.message || "We could not sign you out. Please try again.",
      );
      return false;
    }
    setUser(null);
    setBookings([]);
    setConfirmedBooking(null);
    setNotice("");
    go("/");
    return true;
  };
  const updateProfile = async (name, avatar) => {
    const nextUser = await api.updateProfile(name, avatar);
    setUser(nextUser);
    return nextUser;
  };
  const createBooking = async (values) => {
    const booking = await api.createBooking(values);
    const statuses = readBookingStatuses(booking.email || values.email);
    statuses[booking.id] = booking.status || "pending";
    writeBookingStatuses(booking.email || values.email, statuses);
    setSubmittedBooking(booking);
    if (
      user?.role !== "admin" &&
      booking.email?.toLowerCase() === user?.email?.toLowerCase()
    ) {
      setBookings((current) => [
        booking,
        ...current.filter((item) => item.id !== booking.id),
      ]);
    }
    if (user?.role === "admin") await refresh(true);
    return booking;
  };
  const updateMyBooking = async (id, values) => {
    const booking = await api.updateMyBooking(id, values);
    setBookings((current) =>
      current.map((item) => (item.id === id ? booking : item)),
    );
    const statuses = readBookingStatuses(booking.email || user?.email);
    statuses[id] = booking.status || "pending";
    writeBookingStatuses(booking.email || user?.email, statuses);
    confirmedNoticeSeen.current.delete(id);
    return booking;
  };
  const deleteMyBooking = async (id) => {
    await api.deleteMyBooking(id);
    setBookings((current) => current.filter((item) => item.id !== id));
    const statuses = readBookingStatuses(user?.email);
    delete statuses[id];
    writeBookingStatuses(user?.email, statuses);
    confirmedNoticeSeen.current.delete(id);
  };
  const updateBooking = async (id, status) => {
    await api.updateBooking(id, status);
    setBookings(await api.bookings());
    setReport(await api.reports());
    setSelectedBooking(null);
  };

  if (!ready)
    return (
      <div className="loading-screen">
        <div className="loading-brand">
          DineNova<span>✦</span>
        </div>
        <div className="loading-bar" />
      </div>
    );

  if (path.startsWith("/admin") && user?.role !== "admin") {
    return (
      <PublicLayout
        path="/login"
        go={go}
        user={user}
        settings={settings}
        onLogout={logout}
      >
        <AuthPage
          key="login"
          mode="login"
          onLogin={login}
          onRegister={register}
          onVerifyEmail={verifyEmail}
          onResendVerification={resendVerification}
          go={go}
          initialMessage={notice}
        />
      </PublicLayout>
    );
  }

  if (path === "/booking" && !user)
    return (
      <PublicLayout
        path="/login"
        go={go}
        user={user}
        settings={settings}
        onLogout={logout}
      >
        <AuthPage
          key="login"
          mode="login"
          onLogin={login}
          onRegister={register}
          onVerifyEmail={verifyEmail}
          onResendVerification={resendVerification}
          go={go}
          initialMessage={notice}
        />
      </PublicLayout>
    );

  if (path === "/admin" || path.startsWith("/admin/"))
    return (
      <>
        {notice && (
          <div className="admin-toast" role="status">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label="Dismiss">
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
        <AdminPage
          path={path}
          go={go}
          user={user}
          menu={menu}
          bookings={bookings}
          customers={customers}
          report={report}
          settings={settings}
          onLogout={logout}
          onBookingStatus={setSelectedBooking}
          onSaveMenu={async (item) => {
            setMenu(await api.saveMenuItem(item));
          }}
          onUploadMenuImage={(file) => api.uploadMenuImage(file)}
          onDeleteMenu={async (id) => {
            setMenu(await api.deleteMenuItem(id));
          }}
          onSaveSettings={async (value) => {
            setSettings(await api.updateSettings(value));
          }}
        />
        <BookingDetails
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatus={updateBooking}
        />
      </>
    );

  if (path === "/login" || path === "/register")
    return (
      <PublicLayout
        path={path}
        go={go}
        user={user}
        settings={settings}
        onLogout={logout}
      >
        <AuthPage
          key={path}
          mode={path.slice(1)}
          onLogin={login}
          onRegister={register}
          onVerifyEmail={verifyEmail}
          onResendVerification={resendVerification}
          go={go}
          initialMessage={path === "/login" ? notice : ""}
        />
      </PublicLayout>
    );
  if (path === "/my-bookings") {
    if (!user)
      return (
        <PublicLayout
          path="/login"
          go={go}
          user={user}
          settings={settings}
          onLogout={logout}
        >
          <AuthPage
            key="login"
            mode="login"
            onLogin={login}
            onRegister={register}
            onVerifyEmail={verifyEmail}
            onResendVerification={resendVerification}
            go={go}
          />
        </PublicLayout>
      );
    return (
      <PublicLayout
        path={path}
        go={go}
        user={user}
        settings={settings}
        onLogout={logout}
      >
        <MyBookingsPage
          bookings={bookings}
          user={user}
          go={go}
          onUpdate={updateMyBooking}
          onDelete={deleteMyBooking}
        />
        {submittedBooking &&
          user &&
          submittedBooking.email?.toLowerCase() ===
            user.email?.toLowerCase() && (
            <ReservationNotice
              booking={submittedBooking}
              stage="received"
              restaurantName={settings.restaurantName}
              onClose={() => setSubmittedBooking(null)}
            />
          )}
        <ReservationNotice
          booking={confirmedBooking}
          stage="confirmed"
          restaurantName={settings.restaurantName}
          onClose={() => setConfirmedBooking(null)}
        />
      </PublicLayout>
    );
  }
  if (path === "/profile") {
    if (!user)
      return (
        <PublicLayout
          path="/login"
          go={go}
          user={user}
          settings={settings}
          onLogout={logout}
        >
          <AuthPage
            key="login"
            mode="login"
            onLogin={login}
            onRegister={register}
            onVerifyEmail={verifyEmail}
            onResendVerification={resendVerification}
            go={go}
          />
        </PublicLayout>
      );
    return (
      <PublicLayout
        path={path}
        go={go}
        user={user}
        settings={settings}
        onLogout={logout}
      >
        <ProfilePage
          user={user}
          bookings={bookings}
          go={go}
          onSave={updateProfile}
          onLogout={logout}
        />
        <ReservationNotice
          booking={confirmedBooking}
          stage="confirmed"
          restaurantName={settings.restaurantName}
          onClose={() => setConfirmedBooking(null)}
        />
      </PublicLayout>
    );
  }

  let page;
  if (path === "/") page = <HomePage menu={menu} go={go} />;
  else if (path === "/menu") page = <MenuPage menu={menu} go={go} />;
  else if (path === "/about") page = <AboutPage go={go} />;
  else if (path === "/contact")
    page = <ContactPage settings={settings} go={go} />;
  else if (path === "/booking")
    page = (
      <BookingPage
        onSubmit={createBooking}
        settings={settings}
        menu={menu}
        user={user}
        go={go}
      />
    );
  else
    page = (
      <div className="not-found page-container">
        <span className="eyebrow">WRONG TURN</span>
        <h1>
          That seat's
          <br />
          <em>taken.</em>
        </h1>
        <button className="button button-dark" onClick={() => go("/")}>
          Back to the home page <Icon name="arrow" size={16} />
        </button>
      </div>
    );
  return (
    <PublicLayout
      path={path}
      go={go}
      user={user}
      settings={settings}
      onLogout={logout}
    >
      {demoMode && (
        <div className="preview-banner">
          <span>
            <i /> LOCAL PREVIEW
          </span>
          <p>Sample restaurant details and bookings · saved in this browser</p>
          {user && (
            <button
              onClick={() =>
                go(user.role === "admin" ? "/admin" : "/my-bookings")
              }
            >
              {user.role === "admin" ? "Restaurant desk" : "My reservations"}{" "}
              <Icon name="arrow" size={14} />
            </button>
          )}
        </div>
      )}
      {notice && (
        <div className="site-notice" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}
      {page}
      <ReservationNotice
        booking={confirmedBooking}
        stage="confirmed"
        restaurantName={settings.restaurantName}
        onClose={() => setConfirmedBooking(null)}
      />
    </PublicLayout>
  );
}

export default App;
