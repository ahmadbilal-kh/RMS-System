import { useEffect, useState } from 'react'
import Icon from '../Icon'

export const image = (id, width = 1000) => {
  if (typeof id === 'string' && (/^(data:image\/|https?:\/\/)/i.test(id) || id.startsWith('blob:'))) return id
  if (typeof id === 'string' && id.startsWith('/api/')) {
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')
    return apiUrl + id
  }
  const photoId = id || 'photo-1547592180-85f173990554'
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=85`
}
export const heroPhoto = image("photo-1559339352-11d035aa65de", 1500);
export const telephoneLink = (phone) => "tel:" + (phone || "").replace(/[^+\d]/g, "");

export function SectionTitle({ eyebrow, title, text, centered = false }) {
  return (
    <div className={centered ? "section-title centered" : "section-title"}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

export function DishCard({ item }) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    if (!detailsOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setDetailsOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [detailsOpen])

  return (
    <>
      <article
        className="dish-card"
        role="button"
        tabIndex={0}
        onClick={() => setDetailsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setDetailsOpen(true)
          }
        }}
        aria-haspopup="dialog"
        aria-label={`View details for ${item.name}`}
      >
        <div className="dish-image-wrap">
          <img src={image(item.image, 720)} alt={item.name} loading="lazy" />
          <span className="dish-category">{item.category}</span>
          <span className="dish-open-hint">View details <Icon name="diagonal" size={13} /></span>
        </div>
        <div className="dish-info">
          <div>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
          </div>
          <span className="dish-price">${Number(item.price).toFixed(0)}</span>
        </div>
      </article>
      {detailsOpen && (
        <div
          className="modal-backdrop dish-detail-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setDetailsOpen(false)
          }}
        >
          <section
            className="dish-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`dish-details-${item.id}`}
          >
            <button
              type="button"
              className="icon-button dish-detail-close"
              onClick={() => setDetailsOpen(false)}
              aria-label="Close dish details"
            >
              <Icon name="close" size={18} />
            </button>
            <img className="dish-detail-photo" src={image(item.image, 1000)} alt={item.name} />
            <div className="dish-detail-content">
              <span className="eyebrow">{item.category} · MADE WITH CARE</span>
              <h2 id={`dish-details-${item.id}`}>{item.name}</h2>
              <p className="dish-detail-description">
                {item.description || 'Freshly prepared by our kitchen with seasonal ingredients.'}
              </p>
              <div className="dish-detail-price-row">
                <span>PRICE</span>
                <strong>${Number(item.price).toFixed(2)}</strong>
              </div>
              <p className="dish-detail-note">
                Please let your server know about any allergies or dietary needs before ordering.
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
