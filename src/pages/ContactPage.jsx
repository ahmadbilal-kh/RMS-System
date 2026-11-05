import Icon from '../components/Icon'
import { telephoneLink } from '../components/public/PageElements'

export function ContactPage({ settings, go }) {
  const mapKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapUrl = mapKey
    ? "https://www.google.com/maps/embed/v1/place?key=" +
      encodeURIComponent(mapKey) +
      "&q=" +
      encodeURIComponent(settings.address)
    : "";
  const directionsUrl =
    "https://maps.google.com/?q=" + encodeURIComponent(settings.address);
  return (
    <div className="inner-page page-container contact-page">
      <div className="page-heading">
        <span className="eyebrow">COME ON IN</span>
        <h1>
          Find your way
          <br />
          <em>to the table.</em>
        </h1>
        <p>
          Whether you’re stopping by for a quick bite or making a whole evening
          of it, we can’t wait to see you.
        </p>
      </div>
      <div className="contact-grid">
        <div className="contact-details">
          <div className="contact-item">
            <span className="contact-icon">
              <Icon name="pin" />
            </span>
            <div>
              <span className="eyebrow">OUR ADDRESS</span>
              <p>{settings.address}</p>
              <a href={directionsUrl} target="_blank" rel="noreferrer">
                Get directions <Icon name="diagonal" size={14} />
              </a>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-icon">
              <Icon name="clock" />
            </span>
            <div>
              <span className="eyebrow">WHEN WE’RE OPEN</span>
              <p>{settings.hours}</p>
              <small>For the latest availability, please call ahead.</small>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-icon">
              <Icon name="phone" />
            </span>
            <div>
              <span className="eyebrow">SAY HELLO</span>
              <p>
                <a href={telephoneLink(settings.phone)}>{settings.phone}</a>
                <br />
                <a href={"mailto:" + settings.email}>{settings.email}</a>
              </p>
            </div>
          </div>
          <button
            className="button button-dark contact-reserve"
            onClick={() => go("/booking")}
          >
            Reserve a table <Icon name="arrow" size={16} />
          </button>
        </div>
        <div className="map-card">
          {mapUrl ? (
            <iframe
              className="map-frame"
              title={"Map showing " + settings.address}
              src={mapUrl}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="map-placeholder">
              <span className="map-placeholder-mark">
                <Icon name="pin" size={24} />
              </span>
              <span className="eyebrow">COME FIND US</span>
              <strong>{settings.address}</strong>
              <a href={directionsUrl} target="_blank" rel="noreferrer">
                Open location in Google Maps <Icon name="diagonal" size={14} />
              </a>
            </div>
          )}
          <a
            className="map-link"
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps <Icon name="diagonal" size={15} />
          </a>
        </div>
      </div>
      <div className="contact-bottom">
        <span>BIG PARTY? PRIVATE DINNER? JUST SAY HELLO.</span>
        <a href={"mailto:" + settings.email}>
          Email the team <Icon name="arrow" size={16} />
        </a>
      </div>
    </div>
  );
}
