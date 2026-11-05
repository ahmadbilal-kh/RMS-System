import Icon from '../components/Icon'
import { image } from '../components/public/PageElements'

export function AboutPage({ go }) {
  return (
    <div className="inner-page page-container story-page">
      <div className="page-heading">
        <span className="eyebrow">HOW IT ALL BEGAN</span>
        <h1>
          A restaurant built
          <br />
          around <em>the table.</em>
        </h1>
        <p>
          Not a concept. Not a trend. Just a place to eat well, slow down, and
          remember what a good evening feels like.
        </p>
      </div>
      <div className="story-hero">
        <img
          src={image("photo-1414235077428-338989a2e8c0", 1400)}
          alt="An intimate dinner table at DineNova"
        />
        <div className="story-image-label">EVERY SEAT HAS A STORY</div>
      </div>
      <div className="story-body">
        <div>
          <span className="eyebrow">A LITTLE BIT OF HISTORY</span>
          <h2>
            It began with
            <br />
            one long table.
          </h2>
        </div>
        <div className="story-copy">
          <p>
            Our story started with a simple idea: create the kind of place we
            wished existed on every block. A place where you can bring your
            parents, your first date, or just yourself and a book.
          </p>
          <p>
            We filled it with the food we grew up loving: slow Sunday sauces,
            pasta rolled by hand, tomatoes at their sweetest. We filled it with
            friends. Then neighbors came, and they brought their friends too.
          </p>
          <p>
            Today, the table is a little longer. The sauce is still slow. And if
            you come in hungry, you'll leave feeling like you belong here.
          </p>
          <div className="signature">
            With love, <span>the DineNova family</span>
          </div>
        </div>
      </div>
      <div className="story-values">
        <div>
          <span className="value-number">01</span>
          <h3>Made by hand</h3>
          <p>Our kitchen starts early so your dinner can start slowly.</p>
        </div>
        <div>
          <span className="value-number">02</span>
          <h3>Season first</h3>
          <p>We cook what’s growing now, and let good ingredients speak.</p>
        </div>
        <div>
          <span className="value-number">03</span>
          <h3>Room for one more</h3>
          <p>There’s always a seat, a plate, and a little extra sauce.</p>
        </div>
      </div>
      <div className="story-cta">
        <div>
          <span className="eyebrow">COME SEE FOR YOURSELF</span>
          <h2>
            We saved you
            <br />a <em>seat.</em>
          </h2>
        </div>
        <button className="button button-dark" onClick={() => go("/booking")}>
          Make a reservation <Icon name="arrow" size={16} />
        </button>
      </div>
    </div>
  );
}
