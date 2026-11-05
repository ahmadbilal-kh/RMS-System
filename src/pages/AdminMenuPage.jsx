import { useEffect, useRef, useState } from "react";
import Icon from "../components/Icon";
import { money } from "../components/admin/AdminComponents";
import { image } from "../components/public/PageElements";

async function prepareMenuImage(file) {
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPEG, PNG, or WebP photo.");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Choose a photo smaller than 15 MB.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const optimized = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("The photo could not be prepared.")),
      "image/webp",
      0.8,
    );
  });
  if (optimized.size > 4 * 1024 * 1024) {
    throw new Error("This photo is too large to upload. Choose a smaller image.");
  }
  return optimized;
}

export function AdminMenuPage({ menu, onSave, onUploadImage, onDelete }) {
  const blank = {
    name: "",
    category: "Mains",
    description: "",
    price: "",
    image: "",
    featured: false,
    isAvailable: true,
  };
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageLink, setImageLink] = useState("");
  const [imageMode, setImageMode] = useState("upload");
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInput = useRef(null);
  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const availableCount = menu.filter((item) => item.isAvailable).length;
  const featuredCount = menu.filter((item) => item.featured).length;
  const categories = [...new Set(["Starters", "Mains", "Desserts", "Drinks", ...menu.map((item) => item.category).filter(Boolean)])];
  const items = menu.filter((item) => {
    const matchesSearch = `${item.name} ${item.description}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All categories" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  const clearImageState = () => {
    setSelectedImage(null);
    setImagePreview("");
    setImageLink("");
    setPreviewFailed(false);
  };
  const chooseImage = (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormError("Choose a JPEG, PNG, or WebP photo.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setFormError("Choose a photo smaller than 15 MB.");
      return;
    }
    setImagePreview(URL.createObjectURL(file));
    setSelectedImage(file);
    setImageLink("");
    setImageMode("upload");
    setPreviewFailed(false);
    setFormError("");
  };
  const closeEditor = () => {
    setEditing(null);
    clearImageState();
    setFormError("");
  };
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setFormError("");
    const linkedImage = imageLink.trim();
    if (linkedImage) {
      try {
        if (new URL(linkedImage).protocol !== "https:") throw new Error();
      } catch {
        setFormError("Paste a direct HTTPS link to an image.");
        return;
      }
    }
    if (!editing.image && !selectedImage && !linkedImage) {
      setFormError("Choose a photo or paste an image link before saving.");
      return;
    }
    setSaving(true);
    try {
      const imagePath = selectedImage
        ? await onUploadImage(await prepareMenuImage(selectedImage))
        : linkedImage || editing.image;
      await onSave({ ...editing, price: Number(editing.price), image: imagePath });
      setEditing(null);
      clearImageState();
    } catch (error) {
      setFormError(error.message || "The dish could not be saved.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <div className="admin-welcome">
        <div>
          <span className="eyebrow">FROM OUR KITCHEN</span>
          <h1>Menu management</h1>
          <p>Good ingredients, clear prices, and everything up to date.</p>
        </div>
        <button
          className="button button-dark"
          onClick={() => {
            clearImageState();
            setImageMode("upload");
            setFormError("");
            setEditing({ ...blank });
          }}
        >
          <Icon name="plus" size={17} /> Add a dish
        </button>
      </div>
      <div className="menu-overview-stats">
        <div className="menu-overview-stat"><span>Total dishes</span><strong>{menu.length}</strong></div>
        <div className="menu-overview-stat"><span>Available to guests</span><strong>{availableCount}</strong></div>
        <div className="menu-overview-stat"><span>House favorites</span><strong>{featuredCount}</strong></div>
      </div>
      <div className="list-toolbar">
        <span className="result-count">Showing {items.length} of {menu.length} dishes</span>
        <label className="search-box">
          <Icon name="search" size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="menu-category-filter">
          <span>Category</span>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option>All categories</option>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
      </div>
      <section className="admin-card menu-manager-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>DISH</th>
                <th>CATEGORY</th>
                <th>PRICE</th>
                <th>VISIBILITY</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="menu-table-cell">
                      <img
                        src={image(item.image, 120)}
                        alt=""
                      />
                      <div>
                        <strong>{item.name}</strong>
                        <small>{item.description}</small>
                      </div>
                    </div>
                  </td>
                  <td>{item.category}</td>
                  <td>
                    <strong>{money(item.price)}</strong>
                  </td>
                  <td>
                    <span
                      className={
                        item.isAvailable
                          ? "availability available"
                          : "availability unavailable"
                      }
                    >
                      <i />
                      {item.isAvailable ? "Available" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        aria-label={"Edit " + item.name}
                        onClick={() => {
                          clearImageState();
                          const isLinkedPhoto = /^https:\/\//i.test(item.image || "");
                          if (isLinkedPhoto) setImageLink(item.image);
                          setImageMode(isLinkedPhoto ? "link" : "upload");
                          setFormError("");
                          setEditing({ ...item });
                        }}
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      <button
                        className="icon-button muted-danger"
                        aria-label={"Delete " + item.name}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Remove " + item.name + " from the menu?",
                            )
                          )
                            onDelete(item.id);
                        }}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="menu-table-empty" colSpan="5">
                    <strong>{menu.length ? "No dishes match these filters" : "Your menu is ready for its first dish"}</strong>
                    <span>{menu.length ? "Try a different search or category." : "Add a dish to start building your restaurant menu."}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {editing && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeEditor();
          }}
        >
          <form className="edit-modal menu-edit-modal" onSubmit={submit}>
            <div className="modal-heading">
              <div>
                <span className="eyebrow">MENU ITEM</span>
                <h2>{editing.id ? "Edit dish" : "Add a dish"}</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={closeEditor}
                aria-label="Close"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="menu-editor-grid">
              <div className="menu-editor-details">
            <label className="field">
              <span>Dish name</span>
              <input
                required
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </label>
            <div className="form-grid">
              <label className="field">
                <span>Category</span>
                <select
                  value={editing.category}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.target.value })
                  }
                >
                  {["Starters", "Mains", "Desserts", "Drinks"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Price</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={editing.price}
                  onChange={(e) =>
                    setEditing({ ...editing, price: e.target.value })
                  }
                />
              </label>
            </div>
            <label className="field">
              <span>Description</span>
              <textarea
                required
                rows="3"
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </label>
            <div className="modal-checks">
              <label>
                <input
                  type="checkbox"
                  checked={!!editing.featured}
                  onChange={(e) =>
                    setEditing({ ...editing, featured: e.target.checked })
                  }
                />{" "}
                Show as a house favorite
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!editing.isAvailable}
                  onChange={(e) =>
                    setEditing({ ...editing, isAvailable: e.target.checked })
                  }
                />{" "}
                Available for guests
              </label>
            </div>
              </div>
            <section className="menu-image-field">
              <div className="menu-image-copy">
                <span className="eyebrow">VISUALS</span>
                <strong>Dish photo</strong>
                <span>Use a photo from your device or paste a hosted image link.</span>
              </div>
              <div
                className={`menu-photo-dropzone${isDraggingImage ? " is-dragging" : ""}${previewFailed ? " has-preview-error" : ""}`}
                onDragEnter={(event) => { event.preventDefault(); setIsDraggingImage(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setIsDraggingImage(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDraggingImage(false);
                  chooseImage(event.dataTransfer.files?.[0]);
                }}
              >
                {(imageLink.trim() || imagePreview || editing.image) && !previewFailed ? (
                  <img
                    className="menu-image-preview"
                    src={imageLink.trim() || imagePreview || image(editing.image, 700)}
                    alt={editing.name ? `${editing.name} preview` : "Dish preview"}
                    onError={() => setPreviewFailed(true)}
                  />
                ) : (
                  <div className="menu-image-empty">
                    <span className="menu-upload-icon"><Icon name={previewFailed ? "close" : "dish"} size={24} /></span>
                    <strong>{previewFailed ? "Preview unavailable" : "Drop a dish photo here"}</strong>
                    <span>{previewFailed ? "Check the file or link and try again." : "JPG, PNG, or WebP - up to 15 MB"}</span>
                  </div>
                )}
                {isDraggingImage && <span className="menu-drop-overlay">Drop to use this photo</span>}
              </div>
              <div className="menu-image-source-tabs" role="group" aria-label="Photo source">
                <button type="button" className={imageMode === "upload" ? "active" : ""} onClick={() => { setImageMode("upload"); setImageLink(""); setFormError(""); }}>
                  <Icon name="plus" size={14} /> Upload photo
                </button>
                <button type="button" className={imageMode === "link" ? "active" : ""} onClick={() => { setImageMode("link"); setSelectedImage(null); setImagePreview(""); setPreviewFailed(false); setFormError(""); }}>
                  Link image
                </button>
              </div>
              {imageMode === "upload" ? (
                <div className="menu-photo-actions">
                  <input
                    ref={fileInput}
                    className="menu-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      chooseImage(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  <button type="button" className="menu-image-picker" onClick={() => fileInput.current?.click()}>
                    <Icon name="plus" size={15} /> {selectedImage ? "Choose another photo" : "Browse photos"}
                  </button>
                  <span className="menu-photo-filename">{selectedImage ? selectedImage.name : editing.image ? "Current dish photo" : "No photo selected"}</span>
                </div>
              ) : (
                <label className="field menu-image-link">
                  <span>Direct HTTPS image link</span>
                  <input
                    type="url"
                    value={imageLink}
                    onChange={(event) => {
                      setImageLink(event.target.value);
                      setSelectedImage(null);
                      setImagePreview("");
                      setPreviewFailed(false);
                      setFormError("");
                    }}
                  />
                  <small>Paste a link that opens the image itself, not a page containing it.</small>
                </label>
              )}
              {(selectedImage || imageLink.trim() || editing.image) && (
                <button type="button" className="menu-image-remove" onClick={() => { clearImageState(); setEditing({ ...editing, image: "" }); setFormError(""); }}>
                  Remove photo
                </button>
              )}
              {formError && <p className="menu-image-error" role="alert">{formError}</p>}
            </section>
            </div>
            <button className="button button-dark auth-submit menu-save-button" disabled={saving}>
              {saving ? "Saving…" : "Save dish"} {!saving && <Icon name="check" size={17} />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
