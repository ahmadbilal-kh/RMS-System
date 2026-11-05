import { useMemo, useState } from 'react'
import Icon from '../components/Icon'

const timeOptions = Array.from({ length: 9 }, (_, index) => {
  const minutes = 17 * 60 + index * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
})

function localToday() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

function dateLabel(date) {
  const value = new Date(`${date}T12:00:00`)
  return value.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
}

export function MyBookingsPage({ bookings, user, go, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null)
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const mine = useMemo(
    () => bookings.filter((booking) => booking.email?.toLowerCase() === user?.email?.toLowerCase()),
    [bookings, user],
  )
  const startEditing = (booking) => {
    setActionError('')
    setFormError('')
    setSelectedBookingId(null)
    setEditing({
      id: booking.id,
      customerName: booking.customerName || '',
      phone: booking.phone || '',
      date: booking.date,
      time: booking.time,
      guests: String(booking.guests),
      occasion: booking.occasion || '',
      specialRequests: booking.specialRequests || '',
      orderItems: booking.orderItems || [],
      wasConfirmed: booking.status === 'confirmed',
    })
  }

  const saveChanges = async (event) => {
    event.preventDefault()
    if (!editing || saving) return
    setSaving(true)
    setFormError('')
    try {
      await onUpdate(editing.id, {
        customerName: editing.customerName,
        phone: editing.phone,
        date: editing.date,
        time: editing.time,
        guests: Number(editing.guests),
        occasion: editing.occasion,
        specialRequests: editing.specialRequests,
      })
      setEditing(null)
    } catch (error) {
      setFormError(error.message || 'We could not update this reservation. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const deleteReservation = async (booking) => {
    const approved = window.confirm(`Delete the reservation for ${booking.date} at ${booking.time}? This cannot be undone.`)
    if (!approved) return
    setActionError('')
    try {
      await onDelete(booking.id)
      setSelectedBookingId(null)
    } catch (error) {
      setActionError(error.message || 'We could not delete this reservation. Please try again.')
    }
  }

  return (
    <div className="inner-page page-container my-bookings">
      <div className="my-bookings-heading">
        <div>
          <span className="eyebrow">YOUR PLANS</span>
          <h1>Your reservations,<br /><em>all together.</em></h1>
          <p>Hey {user?.name?.split(' ')[0] || 'there'} - here is what is coming up.</p>
        </div>
        {!!mine.length && <button className="button button-dark" onClick={() => go('/booking')}>Reserve a table <Icon name="arrow" size={16} /></button>}
      </div>
      {actionError && <div className="form-message error" role="alert">{actionError}</div>}
      {mine.length ? (
        <div className="my-booking-list">
          {mine.map((booking) => {
            const canEdit = booking.status !== 'cancelled'
            return (
              <article
                key={booking.id}
                className={selectedBookingId === booking.id ? 'my-booking-card selected' : 'my-booking-card'}
                role="button"
                tabIndex={0}
                aria-expanded={selectedBookingId === booking.id}
                aria-label={`Select reservation for ${booking.date} at ${booking.time} to show actions`}
                onClick={() => setSelectedBookingId((current) => current === booking.id ? null : booking.id)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedBookingId((current) => current === booking.id ? null : booking.id)
                  }
                }}
              >
                <div className="booking-date-block">
                  <span>{dateLabel(booking.date)}</span>
                  <strong>{new Date(`${booking.date}T12:00:00`).getDate()}</strong>
                </div>
                <div className="my-booking-info">
                  <h3>{booking.guests} {Number(booking.guests) === 1 ? 'guest' : 'guests'} - {booking.time}</h3>
                  <p>{booking.occasion || 'Dinner at DineNova'} - 18 Orchard Street</p>
                  {booking.orderItems?.length > 0 && (
                    <p className="my-booking-food">
                      Food pre-order: {booking.orderItems.map((item) => `${item.quantity} x ${item.name}`).join(', ')} - ${Number(booking.orderTotal ?? booking.orderItems.reduce((total, item) => total + Number(item.unitPrice) * item.quantity, 0)).toFixed(2)}
                    </p>
                  )}
                </div>
                <span className={'status-badge ' + booking.status}>{booking.status}</span>
                <div className="my-booking-actions">
                  <button type="button" className="my-booking-icon-action is-delete" aria-label={`Delete reservation for ${booking.date} at ${booking.time}`} title="Delete reservation" onClick={(event) => { event.stopPropagation(); deleteReservation(booking) }}>
                    <Icon name="trash" size={15} />
                  </button>
                  {canEdit && selectedBookingId === booking.id && (
                    <button type="button" className="my-booking-icon-action" aria-label="Update reservation" title="Update reservation" onClick={(event) => { event.stopPropagation(); startEditing(booking) }}>
                      <Icon name="edit" size={15} />
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="calendar" size={28} />
          <h2>No reservations yet</h2>
          <p>Your next favorite evening is one click away.</p>
          <button className="button button-dark" onClick={() => go('/booking')}>
            Book a table <Icon name="arrow" size={16} />
          </button>
        </div>
      )}
      {editing && (
        <div className="modal-backdrop reservation-edit-backdrop" onClick={(event) => { if (event.target === event.currentTarget && !saving) setEditing(null) }}>
          <form className="reservation-edit-modal" onSubmit={saveChanges}>
            <div className="modal-heading">
              <div><span className="eyebrow">RESERVATION</span><h2>Update your plans</h2></div>
              <button type="button" className="icon-button" aria-label="Close" disabled={saving} onClick={() => setEditing(null)}><Icon name="close" /></button>
            </div>
            {editing.wasConfirmed && (
              <div className="reservation-edit-note">
                Changing a confirmed reservation sends it back to the restaurant for confirmation.
              </div>
            )}
            {editing.date < localToday() && (
              <div className="reservation-edit-note">
                This reservation date has passed. Choose a new future date before saving your changes.
              </div>
            )}
            <div className="reservation-edit-grid">
              <label className="field">
                <span>Name</span>
                <input required minLength="2" maxLength="100" value={editing.customerName} onChange={(event) => setEditing({ ...editing, customerName: event.target.value })} />
              </label>
              <label className="field">
                <span>Phone number</span>
                <input required minLength="7" maxLength="40" type="tel" value={editing.phone} onChange={(event) => setEditing({ ...editing, phone: event.target.value })} />
              </label>
              <label className="field">
                <span>Date</span>
                <input required type="date" min={localToday()} value={editing.date} onChange={(event) => setEditing({ ...editing, date: event.target.value })} />
              </label>
              <label className="field">
                <span>Time</span>
                <select required value={editing.time} onChange={(event) => setEditing({ ...editing, time: event.target.value })}>
                  {timeOptions.map((time) => <option key={time} value={time}>{new Date(`1970-01-01T${time}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</option>)}
                  {!timeOptions.includes(editing.time) && <option value={editing.time}>{editing.time}</option>}
                </select>
              </label>
              <label className="field">
                <span>Guests</span>
                <select value={editing.guests} onChange={(event) => setEditing({ ...editing, guests: event.target.value })}>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} {count === 1 ? 'guest' : 'guests'}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Occasion</span>
                <select value={editing.occasion} onChange={(event) => setEditing({ ...editing, occasion: event.target.value })}>
                  <option value="">Just a lovely dinner</option>
                  {['Birthday', 'Anniversary', 'Date night', 'Family dinner', 'Other celebration'].map((occasion) => <option key={occasion}>{occasion}</option>)}
                  {editing.occasion && !['Birthday', 'Anniversary', 'Date night', 'Family dinner', 'Other celebration'].includes(editing.occasion) && <option>{editing.occasion}</option>}
                </select>
              </label>
              <label className="field reservation-edit-wide">
                <span>Special requests</span>
                <textarea maxLength="1000" rows="3" value={editing.specialRequests} onChange={(event) => setEditing({ ...editing, specialRequests: event.target.value })} />
              </label>
            </div>
            {editing.orderItems.length > 0 && (
              <p className="reservation-edit-preorder">Your food pre-order stays with this reservation: {editing.orderItems.map((item) => `${item.quantity} x ${item.name}`).join(', ')}.</p>
            )}
            {formError && <div className="form-message error" role="alert">{formError}</div>}
            <div className="reservation-edit-actions">
              <button type="button" className="button button-outline" disabled={saving} onClick={() => setEditing(null)}>Keep as is</button>
              <button type="submit" className="button button-dark" disabled={saving}>{saving ? 'Saving...' : 'Save changes'} <Icon name="check" size={16} /></button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
