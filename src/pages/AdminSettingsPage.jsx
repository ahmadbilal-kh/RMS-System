import { useState } from 'react'
import Icon from '../components/Icon'

export function AdminSettingsPage({ settings, onSave }) {
  const [form, setForm] = useState(settings)
  const [saved, setSaved] = useState(false)
  const update = (e) => { setSaved(false); setForm({ ...form, [e.target.name]: e.target.value }) }
  const submit = async (e) => { e.preventDefault(); await onSave(form); setSaved(true) }
  return <>
    <div className="admin-welcome"><div><span className="eyebrow">THE HOUSE DETAILS</span><h1>Make it yours.</h1><p>Keep your restaurant’s contact information current for guests.</p></div></div>
    <form className="admin-card settings-form" onSubmit={submit}>
      <div className="card-heading"><div><span className="eyebrow">PUBLIC DETAILS</span><h2>Restaurant information</h2></div></div>
      <div className="settings-grid">
        <label className="field"><span>Restaurant name</span><input required name="restaurantName" value={form.restaurantName} onChange={update} /></label>
        <label className="field"><span>Tagline</span><input name="tagline" value={form.tagline} onChange={update} /></label>
        <label className="field"><span>Phone number</span><input required name="phone" value={form.phone} onChange={update} /></label>
        <label className="field"><span>Email address</span><input required type="email" name="email" value={form.email} onChange={update} /></label>
        <label className="field field-wide"><span>Street address</span><input required name="address" value={form.address} onChange={update} /></label>
        <label className="field field-wide"><span>About your restaurant</span><textarea rows="4" name="description" value={form.description} onChange={update} /></label>
        <label className="field field-wide"><span>Opening hours</span><input required name="hours" value={form.hours} onChange={update} /></label>
        <label className="field"><span>Instagram profile <small>OPTIONAL</small></span><input type="url" name="instagram" value={form.instagram || ''} onChange={update} /></label>
        <label className="field"><span>Facebook page <small>OPTIONAL</small></span><input type="url" name="facebook" value={form.facebook || ''} onChange={update} /></label>
      </div>
      <div className="settings-actions">{saved && <span className="saved-note"><Icon name="check" size={15} /> Changes saved</span>}<button className="button button-dark">Save changes <Icon name="arrow" size={16} /></button></div>
    </form>
  </>
}
