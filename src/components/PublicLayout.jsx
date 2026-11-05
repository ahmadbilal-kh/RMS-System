import { useState } from "react";
import Icon from "./Icon";
import BrandMark from "./BrandMark";
import BrandText from "./BrandText";

const links = [
  ["Home", "/"],
  ["Our story", "/about"],
  ["Menu", "/menu"],
  ["Contact", "/contact"],
];

export function PublicLayout({ children, path, go, user, settings = {}, onLogout }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState("");
  const navigate = (url) => {
    setOpen(false);
    go(url);
  };
  const signOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutMessage("");
    try {
      const signedOut = await onLogout?.();
      if (signedOut === false) setLogoutMessage("Could not sign out. Please try again.");
    } catch {
      setLogoutMessage("Could not sign out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };
  const brandName = settings.restaurantName || "DineNova";
  const tagline = settings.tagline || "Good Food. Great Mood.";
  const openingHours = "Open 24 hours, 7 days a week";
  return (
    <div className="site-shell">
      <div className="announcement">
        <span>YOUR NEIGHBORHOOD TABLE</span>
        <span className="announcement-right">
          <Icon name="clock" size={14} />{" "}
          {openingHours.toUpperCase()}
        </span>
      </div>
      <header className="site-header">
        <button
          className="brand"
          onClick={() => navigate("/")}
          aria-label={brandName + " home"}
        >
          <BrandMark />
          <span className="brand-copy">
            <BrandText name={brandName} />
            <small>{tagline.toUpperCase()}</small>
          </span>
        </button>
        <button
          className="mobile-menu"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
        <nav
          className={open ? "main-nav is-open" : "main-nav"}
          aria-label="Main navigation"
        >
          {links.map(([label, url]) => (
            <button
              key={url}
              className={path === url ? "nav-link active" : "nav-link"}
              onClick={() => navigate(url)}
            >
              {label}
            </button>
          ))}
          {user ? (
            <>
              {user.role === "admin" && (
                <button className="nav-login" onClick={() => navigate("/admin")}>
                  Dashboard <Icon name="diagonal" size={16} />
                </button>
              )}
              {user.role !== "admin" && (
                <button
                  className={path === "/my-bookings" ? "nav-link active" : "nav-link"}
                  onClick={() => navigate("/my-bookings")}
                >
                  My reservations
                </button>
              )}
              <button
                className={path === "/profile" ? "nav-link active" : "nav-link"}
                onClick={() => navigate("/profile")}
              >
                <Icon name="user" size={15} /> Profile
              </button>
              <button className="nav-login" onClick={signOut} disabled={loggingOut}>
                {loggingOut ? "Signing out..." : "Sign out"}
              </button>
            </>
          ) : (
            <button className="nav-login" onClick={() => navigate("/login")}>
              Sign in <Icon name="diagonal" size={16} />
            </button>
          )}
        </nav>
      </header>
      {logoutMessage && <div className="logout-message" role="alert">{logoutMessage}</div>}
      <main>{children}</main>
      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <div className="brand footer-brand">
              <BrandMark />
              <span className="brand-copy">
                <BrandText name={brandName} />
                <small>{tagline.toUpperCase()}</small>
              </span>
            </div>
            <p>
              {settings.description ||
                "A neighborhood table for handmade cooking, warm evenings, and the people you love."}
            </p>
          </div>
          <div className="footer-column">
            <span className="eyebrow">COME BY</span>
            <p>{settings.address || "18 Orchard Street, New York, NY 10002"}</p>
            <a
              href={
                "tel:" +
                (settings.phone || "(212) 555-0198").replace(/[^+\d]/g, "")
              }
            >
              {settings.phone || "(212) 555-0198"}
            </a>
          </div>
          <div className="footer-column">
            <span className="eyebrow">THE LITTLE DETAILS</span>
            <p>{openingHours}</p>
            <button onClick={() => navigate("/booking")}>
              Book your table <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="footer-column">
            <span className="eyebrow">SAY HELLO</span>
            <div className="social-demo-actions" aria-label="Demo contact and social links">
              {[
                ['Email', 'mail'],
                ['WhatsApp', 'whatsapp'],
                ['Facebook', 'facebook'],
                ['X / Twitter', 'xSocial'],
                ['Call', 'phone'],
              ].map(([label, icon]) => (
                <a key={label} href="/" title={`${label} demo action`} aria-label={`${label}; demo action returns to home`}>
                  <Icon name={icon} size={17} />
                </a>
              ))}
            </div>
            <p className="footer-note">
              Find us online or get in touch. We look forward to welcoming you.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 {brandName} Restaurant</span>
          <span>
            Made with care, served with love <Icon name="heart" size={13} />
          </span>
          <button onClick={() => navigate("/login")}>Staff sign in</button>
        </div>
      </footer>
    </div>
  );
}
