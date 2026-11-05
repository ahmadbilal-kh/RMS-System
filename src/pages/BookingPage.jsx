import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { image, telephoneLink } from '../components/public/PageElements'

export function BookingPage({ onSubmit, settings, menu = [], user, go }) {
  const emptyForm = {
    customerName: "",
    email: "",
    phone: "",
    date: "",
    time: "19:00",
    guests: "2",
    occasion: "",
    specialRequests: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [foodQuantities, setFoodQuantities] = useState({});
  useEffect(() => {
    if (!user) return
    setForm((current) => ({
      ...current,
      customerName: current.customerName || user.name || '',
      email: current.email || user.email || '',
    }))
  }, [user?.id, user?.name, user?.email])
  const availableMenu = menu.filter((item) => item.isAvailable !== false);
  const foodItems = availableMenu
    .filter((item) => Number(foodQuantities[item.id]) > 0)
    .map((item) => ({
      menuItemId: item.id,
      quantity: Number(foodQuantities[item.id]),
    }));
  const foodTotal = availableMenu.reduce(
    (total, item) =>
      total + Number(item.price) * Number(foodQuantities[item.id] || 0),
    0,
  );
  const currentDate = new Date();
  const minDate = [
    currentDate.getFullYear(),
    String(currentDate.getMonth() + 1).padStart(2, "0"),
    String(currentDate.getDate()).padStart(2, "0"),
  ].join("-");
  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  const times = [
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
  ];
  const timeLabel = (time) =>
    new Date("1970-01-01T" + time + ":00").toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({ ...form, guests: Number(form.guests), foodItems });
      setMessage(
        "Your request is on its way. We’ll be in touch shortly to confirm your table.",
      );
      setForm(emptyForm);
      setFoodQuantities({});
      go('/my-bookings')
    } catch (error) {
      setMessage(
        error.message || "We could not save your request. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
    <div className="booking-page page-container">
      <div className="booking-intro">
        <span className="eyebrow">PULL UP A CHAIR</span>
        <h1>
          Let’s make a<br />
          <em>night of it.</em>
        </h1>
        <p>
          Tell us when you’re coming and we’ll take care of the rest. For larger
          parties, please give us a call.
        </p>
        <div className="booking-contact">
          <Icon name="phone" size={17} />
          <a href={telephoneLink(settings.phone)}>{settings.phone}</a>
          <span>·</span>
          <span>{settings.hours}</span>
        </div>
        <div className="booking-photo">
          <img
            src={image("photo-1517248135467-4c7edcad34c4", 900)}
            alt="Candlelit dinner table"
          />
          <span>THE BEST SEAT IS THE ONE WITH YOUR NAME ON IT.</span>
        </div>
      </div>
      <div className="booking-form-panel">
        <div className="form-title">
          <span className="eyebrow">RESERVATION REQUEST</span>
          <h2>Save your seat.</h2>
          <p>We’ll confirm by email or phone within a few hours.</p>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <label className="field">
            <span>Your name *</span>
            <input
              required
              name="customerName"
              value={form.customerName}
              onChange={update}
              autoComplete="name"
            />
          </label>
          <label className="field">
            <span>Email address *</span>
            <input
              required
              name="email"
              type="email"
              value={form.email}
              onChange={update}
              readOnly={!!user?.email}
              autoComplete="email"
            />
            {user?.email && <small>This reservation will be saved to your account.</small>}
          </label>
          <label className="field">
            <span>Phone number *</span>
            <input
              required
              name="phone"
              type="tel"
              value={form.phone}
              onChange={update}
              autoComplete="tel"
            />
          </label>
          <label className="field">
            <span>Number of guests *</span>
            <select name="guests" value={form.guests} onChange={update}>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "guest" : "guests"}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Date *</span>
            <input
              required
              type="date"
              name="date"
              min={minDate}
              value={form.date}
              onChange={update}
            />
          </label>
          <label className="field">
            <span>Time *</span>
            <select name="time" value={form.time} onChange={update}>
              {times.map((time) => (
                <option key={time} value={time}>
                  {timeLabel(time)}
                </option>
              ))}
            </select>
          </label>
          <label className="field field-wide">
            <span>
              What are we celebrating? <small>OPTIONAL</small>
            </span>
            <select name="occasion" value={form.occasion} onChange={update}>
              <option value="">Just a lovely dinner</option>
              <option>Birthday</option>
              <option>Anniversary</option>
              <option>Date night</option>
              <option>Family dinner</option>
              <option>Other celebration</option>
            </select>
          </label>
          <section className="preorder-section field-wide" aria-labelledby="preorder-title">
            <div className="preorder-heading">
              <div>
                <span className="eyebrow">OPTIONAL</span>
                <h3 id="preorder-title">Pre-order something from our kitchen</h3>
                <p>Choose dishes and quantities. We’ll confirm your food order with the table reservation.</p>
              </div>
              {foodItems.length > 0 && (
                <strong className="preorder-total">${foodTotal.toFixed(2)}</strong>
              )}
            </div>
            {availableMenu.length ? (
              <div className="preorder-list">
                {availableMenu.map((item) => (
                  <label className="preorder-item" key={item.id}>
                    <span className="preorder-item-copy">
                      <strong>{item.name}</strong>
                      <small>{item.category} · ${Number(item.price).toFixed(2)}</small>
                    </span>
                    <span className="preorder-quantity">
                      <select
                        value={foodQuantities[item.id] || 0}
                        onChange={(event) =>
                          setFoodQuantities((current) => ({
                            ...current,
                            [item.id]: Number(event.target.value),
                          }))
                        }
                        aria-label={`Quantity of ${item.name}`}
                      >
                        <option value="0">Skip</option>
                        {Array.from({ length: 10 }, (_, index) => index + 1).map((quantity) => (
                          <option key={quantity} value={quantity}>{quantity}</option>
                        ))}
                      </select>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="preorder-empty">No dishes are available to pre-order right now.</p>
            )}
            {foodItems.length > 0 && (
              <p className="preorder-summary">Estimated food subtotal: <strong>${foodTotal.toFixed(2)}</strong> · Payment is not collected here.</p>
            )}
          </section>
          <label className="field field-wide">
            <span>
              Anything else we should know? <small>OPTIONAL</small>
            </span>
            <textarea
              name="specialRequests"
              rows="3"
              value={form.specialRequests}
              onChange={update}
            />
          </label>
          {message && !message.startsWith("Your request") && (
            <div className="form-message error" role="alert">
              {message}
            </div>
          )}
          <button
            className="button button-dark submit-booking"
            type="submit"
            disabled={saving}
          >
            {saving ? "Sending…" : "Request a reservation"}{" "}
            <Icon name="arrow" size={17} />
          </button>
          <span className="form-footnote">
            <Icon name="heart" size={13} /> We’ll hold your details with care.
            No payment needed.
          </span>
        </form>
      </div>
    </div>
    </>
  );
}
