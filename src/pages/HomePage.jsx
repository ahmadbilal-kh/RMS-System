import Icon from '../components/Icon'
import { DishCard, SectionTitle, heroPhoto, image } from '../components/public/PageElements'

export function HomePage({ menu, go }) {
  const favorites = menu
    .filter((item) => item.featured && item.isAvailable !== false)
    .slice(0, 3);
  return (
    <>
      <section className="home-hero page-container">
        <div className="hero-copy">
          <span className="eyebrow">
            <i className="eyebrow-dot" /> YOUR CORNER OF ITALY
          </span>
          <h1>
            A little taste
            <br />
            of Italy. A lot
            <br />
            <em>of feeling.</em>
          </h1>
          <p>
            Come for the handmade pasta. Stay for the second glass, the familiar
            faces, and the feeling that you’re right where you belong.
          </p>
          <div className="hero-actions">
            <button
              className="button button-dark"
              onClick={() => go("/booking")}
            >
              Reserve a table <Icon name="arrow" size={17} />
            </button>
            <button className="text-button" onClick={() => go("/menu")}>
              Explore the menu <Icon name="diagonal" size={16} />
            </button>
          </div>
          <div className="hero-rating">
            <span className="rating-stars">✳</span>
            <span>
              <strong>Handmade daily</strong> · served with care
            </span>
          </div>
        </div>
        <div className="hero-art">
          <img
            src={heroPhoto}
            alt="A warmly lit neighborhood Italian restaurant"
          />
          <div className="hero-stamp">
            <span>MADE BY HAND</span>
            <strong>
              Served
              <br />
              with love
            </strong>
            <Icon name="heart" size={19} />
          </div>
          <div className="hero-caption">
            <span>18 ORCHARD STREET</span>
            <span>NEW YORK, NY</span>
          </div>
        </div>
      </section>
      <div className="marquee">
        <span>
          HANDMADE PASTA <i>✳</i> SEASONAL INGREDIENTS <i>✳</i> YOUR
          NEIGHBORHOOD TABLE <i>✳</i> HANDMADE PASTA <i>✳</i> SEASONAL
          INGREDIENTS
        </span>
      </div>
      <section className="intro-section page-container">
        <div className="intro-photo">
          <img
            src={image("photo-1551183053-bf91a1d81141", 900)}
            alt="Fresh pasta tossed with seasonal ingredients"
            loading="lazy"
          />
          <div className="photo-note">
            Pasta made fresh
            <br />
            every single morning.
          </div>
        </div>
        <div className="intro-copy">
          <span className="eyebrow">A PLACE AT OUR TABLE</span>
          <h2>
            Some things are
            <br />
            just better <em>shared.</em>
          </h2>
          <p>
            DineNova started with a simple idea: the best nights aren’t planned
            down to the minute. They happen around a table, over something
            delicious, with nowhere else you need to be.
          </p>
          <p>
            So we make our pasta by hand, pour generously, and save you a seat.
            That’s the whole recipe.
          </p>
          <button
            className="text-button underline-button"
            onClick={() => go("/about")}
          >
            A little more about us <Icon name="arrow" size={17} />
          </button>
          <div className="signature">
            With love, <span>the DineNova family</span>
          </div>
        </div>
      </section>
      <section className="favorites-section">
        <div className="page-container">
          <div className="section-heading-row">
            <SectionTitle
              eyebrow="A FEW HOUSE FAVORITES"
              title={
                <>
                  The ones you'll
                  <br />
                  <em>think about later.</em>
                </>
              }
              text="Made from scratch, with whatever's good right now."
            />
            <button
              className="button button-outline"
              onClick={() => go("/menu")}
            >
              See the full menu <Icon name="arrow" size={17} />
            </button>
          </div>
          <div className="dish-grid">
            {favorites.map((item) => (
              <DishCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>
      <section className="quote-section">
        <div className="quote-mark">“</div>
        <blockquote>
          Good food brings us to the table. Good company makes us stay.
        </blockquote>
        <span className="quote-byline">THE DINENOVA TABLE</span>
      </section>
      <section className="reserve-banner page-container">
        <div>
          <span className="eyebrow">YOUR TABLE IS WAITING</span>
          <h2>
            Make a night
            <br />
            of <em>it.</em>
          </h2>
          <p>
            Little celebration or just Tuesday? We’ll have the candles ready
            either way.
          </p>
        </div>
        <div className="reserve-banner-right">
          <button
            className="button button-light"
            onClick={() => go("/booking")}
          >
            Book your table <Icon name="arrow" size={17} />
          </button>
          <span>WALK-INS ALWAYS WELCOME</span>
        </div>
        <div className="reserve-deco">S</div>
      </section>
    </>
  );
}
