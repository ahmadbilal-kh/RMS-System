import Icon from '../Icon'

export const today = () => { const date = new Date(); return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') }
export const money = (n) => '$' + Number(n || 0).toFixed(0)
export const niceDate = (date) => new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
export const shortDay = (offset) => { const date = new Date(); date.setDate(date.getDate() - 6 + offset); return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1).toUpperCase() }

export function StatCard({ label, value, foot, icon, trend }) {
  return <article className="stat-card"><div className="stat-top"><span>{label}</span><i><Icon name={icon} size={18} /></i></div><strong>{value}</strong><div className="stat-foot"><span className="trend-chip">{trend}</span><span>{foot}</span></div></article>
}

export function BookingTable({ bookings, onStatus, compact = false }) {
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>GUEST</th><th>DATE & TIME</th><th>PARTY</th><th>OCCASION</th><th>STATUS</th>{!compact && <th></th>}</tr></thead><tbody>{bookings.map((item) => <tr key={item.id}><td><div className="guest-cell"><span className="avatar-initial">{item.customerName.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span><div><strong>{item.customerName}</strong><small>{item.email}</small></div></div></td><td><strong>{niceDate(item.date)}</strong><small className="table-sub">{item.time}</small></td><td>{item.guests} guests</td><td>{item.occasion || 'Dinner'}</td><td><span className={'status-badge ' + item.status}><i />{item.status}</span></td>{!compact && <td><button className="icon-button" aria-label="Manage reservation" onClick={() => onStatus(item)}><Icon name="diagonal" size={16} /></button></td>}</tr>)}</tbody></table>{bookings.length === 0 && <div className="table-empty">No reservations to show.</div>}</div>
}
