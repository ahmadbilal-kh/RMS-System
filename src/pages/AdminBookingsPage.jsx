import { useState } from 'react'
import Icon from '../components/Icon'
import { BookingTable, niceDate } from '../components/admin/AdminComponents'

export function AdminBookingsPage({ bookings, onStatus }) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const filtered = bookings.filter((booking) => (filter === 'all' || booking.status === filter) && booking.customerName.toLowerCase().includes(query.toLowerCase()))
  return <><div className="admin-welcome"><div><span className="eyebrow">GUEST EXPERIENCE</span><h1>Reservation book</h1><p>Keep every guest and every occasion in good hands.</p></div><button className="button button-dark" onClick={() => window.print()}><Icon name="diagonal" size={16} /> Print list</button></div><div className="list-toolbar"><div className="filter-pills admin-filters">{['all','pending','confirmed','cancelled'].map((item) => <button key={item} className={filter === item ? 'filter-pill selected' : 'filter-pill'} onClick={() => setFilter(item)}>{item[0].toUpperCase() + item.slice(1)} <small>{item === 'all' ? bookings.length : bookings.filter((booking) => booking.status === item).length}</small></button>)}</div><label className="search-box"><Icon name="search" size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} /></label></div><section className="admin-card booking-list-card"><BookingTable bookings={filtered} onStatus={onStatus} /></section></>
}
