import Icon from './Icon'

function formattedDate(date) {
  if (!date) return 'Date to be confirmed'
  const value = new Date(`${date}T12:00:00`)
  return Number.isNaN(value.getTime())
    ? date
    : value.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formattedTime(time) {
  if (!time) return 'To be confirmed'
  const value = new Date(`1970-01-01T${time}:00`)
  return Number.isNaN(value.getTime())
    ? time
    : value.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function ReservationNotice({ booking, stage = 'received', restaurantName = 'DineNova', onClose }) {
  if (!booking) return null
  const confirmed = stage === 'confirmed'
  const orderItems = booking.orderItems || []

  return (
    <div
      className="reservation-notice-backdrop"
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <section className="reservation-notice-modal" role="dialog" aria-modal="true" aria-labelledby="reservation-notice-title">
        <button className="reservation-notice-close" type="button" aria-label="Close" onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
        <div className={`reservation-notice-mark${confirmed ? ' is-confirmed' : ''}`}>
          <Icon name={confirmed ? 'check' : 'heart'} size={25} />
        </div>
        <span className="eyebrow">{confirmed ? 'YOUR TABLE IS READY' : 'REQUEST RECEIVED'}</span>
        <h2 id="reservation-notice-title">
          {confirmed ? 'We saved you a seat.' : 'Thank you for choosing us.'}
        </h2>
        <p className="reservation-notice-copy">
          {confirmed
            ? `Your table at ${restaurantName} is confirmed. We are looking forward to welcoming you.`
            : `We have received your reservation request for ${restaurantName}. Our team will review it and confirm your table soon.`}
        </p>
        <div className="reservation-notice-details">
          <div><span className="eyebrow">DATE</span><strong>{formattedDate(booking.date)}</strong></div>
          <div><span className="eyebrow">TIME</span><strong>{formattedTime(booking.time)}</strong></div>
          <div><span className="eyebrow">PARTY</span><strong>{booking.guests} {Number(booking.guests) === 1 ? 'guest' : 'guests'}</strong></div>
        </div>
        {orderItems.length > 0 && (
          <div className="reservation-notice-preorder">
            <Icon name="dish" size={16} />
            <span>{orderItems.map((item) => `${item.quantity} x ${item.name}`).join(', ')}</span>
          </div>
        )}
        <div className={`reservation-notice-status${confirmed ? ' is-confirmed' : ''}`}>
          <i /> {confirmed ? 'Confirmed by the restaurant' : 'Waiting for restaurant confirmation'}
        </div>
        {!confirmed && <p className="reservation-notice-hint">We will get in touch using the contact details you provided. You can also follow the status under My reservations when signed in with this email.</p>}
        <button className="button button-dark reservation-notice-button" type="button" onClick={onClose}>
          {confirmed ? 'See you soon' : 'Back to the restaurant'} <Icon name="arrow" size={16} />
        </button>
      </section>
    </div>
  )
}
