import { useState } from 'react'
import Icon from '../components/Icon'
import { DishCard } from '../components/public/PageElements'

export function MenuPage({ menu, go }) {
  const [category, setCategory] = useState("All");
  const availableMenu = menu.filter((item) => item.isAvailable !== false);
  const categories = ["All", ...new Set(availableMenu.map((item) => item.category))];
  const filtered =
    category === "All"
      ? availableMenu
      : availableMenu.filter((item) => item.category === category);
  return (
    <div className="inner-page page-container">
      <div className="page-heading">
        <span className="eyebrow">FRESH FROM OUR KITCHEN</span>
        <h1>
          Good things
          <br />
          <em>on the table.</em>
        </h1>
        <p>
          Our menu changes with the seasons, but the good stuff stays the same:
          beautiful ingredients, made by hand, and meant to be enjoyed together.
        </p>
        <div className="menu-note">
          <Icon name="dish" size={19} /> All pasta is made fresh in house each
          morning.
        </div>
      </div>
      <div className="menu-toolbar">
        <div className="filter-pills">
          {categories.map((item) => (
            <button
              key={item}
              className={
                category === item ? "filter-pill selected" : "filter-pill"
              }
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <span className="menu-price-note">A little something for everyone</span>
      </div>
      <div className="dish-grid full-menu-grid">
        {filtered.length ? (
          filtered.map((item) => <DishCard key={item.id} item={item} />)
        ) : (
          <div className="menu-empty">
            <span className="eyebrow">OUR KITCHEN</span>
            <h2>{category !== "All" && availableMenu.length ? "No dishes in this category yet" : "Our menu is being prepared"}</h2>
            <p>{category !== "All" && availableMenu.length ? "Choose another category to see more of the menu." : "Please check back soon, or contact us and we’ll be happy to help."}</p>
            {(!availableMenu.length || category === "All") && <button className="button button-outline" onClick={() => go("/contact")}>Contact the restaurant <Icon name="arrow" size={15} /></button>}
          </div>
        )}
      </div>
      <div className="menu-footer-note">
        Please let your server know about any allergies or dietary needs.{" "}
        <button className="text-button" onClick={() => go("/contact")}>
          Ask us anything <Icon name="arrow" size={15} />
        </button>
      </div>
    </div>
  );
}
