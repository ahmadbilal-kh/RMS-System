import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon'

async function makeProfilePhoto(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    throw new Error('Choose a photo image such as JPG, PNG, or WebP.')
  }
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose an image smaller than 10 MB.')

  const image = await createImageBitmap(file)
  const scale = Math.min(1, 512 / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  const context = canvas.getContext('2d')
  if (!context) {
    image.close()
    throw new Error('This image could not be prepared. Please choose another one.')
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  image.close()
  return canvas.toDataURL('image/jpeg', 0.82)
}

export function ProfilePage({ user, bookings = [], go, onSave, onLogout }) {
  const [name, setName] = useState(user?.name || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [busy, setBusy] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const photoInput = useRef(null)
  const history = useMemo(
    () => [...bookings].sort((left, right) => `${right.date}T${right.time}`.localeCompare(`${left.date}T${left.time}`)),
    [bookings],
  )
  const initials = (user?.name || user?.email || 'G')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  useEffect(() => {
    setName(user?.name || '')
    setAvatar(user?.avatar || '')
  }, [user?.email, user?.name, user?.avatar])

  const choosePhoto = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setMessage('')
    try {
      setAvatar(await makeProfilePhoto(file))
      setMessage('Photo selected. Save changes to update your profile.')
    } catch (photoError) {
      setError(photoError.message || 'This photo could not be selected. Please try another.')
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    const cleanName = name.trim()
    if (cleanName.length < 2 || cleanName.length > 80) {
      setError('Your name must be between 2 and 80 characters.')
      setMessage('')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const updatedUser = await onSave(cleanName, avatar)
      setName(updatedUser.name)
      setAvatar(updatedUser.avatar || '')
      setMessage('Your profile has been updated.')
    } catch (saveError) {
      setError(saveError.message || 'We could not update your profile. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const signOut = async () => {
    setSigningOut(true)
    setError('')
    try {
      const signedOut = await onLogout()
      if (signedOut === false) setError('Could not sign out. Please try again.')
    } catch {
      setError('Could not sign out. Please try again.')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="inner-page page-container profile-page">
      <span className="eyebrow">YOUR ACCOUNT</span>
      <h1>
        Your profile,
        <br />
        <em>your details.</em>
      </h1>
      <p className="profile-intro">Keep your account information up to date.</p>
      <div className={`profile-content-grid${user?.role === 'admin' ? ' admin-profile-layout' : ''}`}>
        <form className="profile-card" onSubmit={submit}>
          <div className="profile-identity">
            <button
              type="button"
              className="profile-avatar-picker"
              onClick={() => photoInput.current?.click()}
              aria-label="Choose a profile photo from your device"
              title="Choose a profile photo"
            >
              <span className="profile-avatar">
                {avatar ? <img src={avatar} alt="" /> : initials || <Icon name="user" size={27} />}
              </span>
              <span className="profile-avatar-camera"><Icon name="camera" size={15} /></span>
            </button>
            <input ref={photoInput} className="profile-photo-input" type="file" accept="image/*" onChange={choosePhoto} />
            <div className="profile-identity-copy">
              <strong>{user?.name || 'Restaurant guest'}</strong>
              <span>{user?.email}</span>
              <small>{user?.role === 'admin' ? 'Restaurant administrator' : 'DineNova guest'}</small>
            </div>
          </div>
          <label className="field">
            <span>Your name</span>
            <input
              required
              minLength="2"
              maxLength="80"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Email address</span>
            <input type="email" value={user?.email || ''} readOnly />
            <small>Your email is used to sign in and cannot be changed here.</small>
          </label>
          {error && <div className="form-message error" role="alert">{error}</div>}
          {message && <div className="form-message success" role="status">{message}</div>}
          <div className="profile-actions">
            <button className="button button-dark" disabled={busy}>
              {busy ? 'Saving...' : 'Save changes'} <Icon name="arrow" size={16} />
            </button>
            {user?.role === 'admin' && <button type="button" className="button button-outline" onClick={() => go('/admin')}>Restaurant dashboard</button>}
            <button type="button" className="profile-signout" onClick={signOut} disabled={signingOut}>
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </form>
        {user?.role !== 'admin' && (
          <section className="profile-history">
            <div className="profile-history-heading">
              <div>
                <span className="eyebrow">YOUR DINE NOVA VISITS</span>
                <h2>Reservation history</h2>
              </div>
              <button type="button" className="button button-outline" onClick={() => go('/my-bookings')}>View reservations</button>
            </div>
            {history.length ? (
              <div className="profile-history-list">
                {history.slice(0, 5).map((booking) => (
                  <article className="profile-history-row" key={booking.id}>
                    <span className="profile-history-date">
                      {new Date(`${booking.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span>{booking.guests} {Number(booking.guests) === 1 ? 'guest' : 'guests'} · {booking.time}</span>
                    <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="profile-history-empty">
                <Icon name="calendar" size={22} />
                <div><strong>No table reservations yet</strong><span>Reserve your first table and it will appear here.</span></div>
                <button type="button" className="button button-dark" onClick={() => go('/booking')}>Reserve a table <Icon name="arrow" size={15} /></button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
