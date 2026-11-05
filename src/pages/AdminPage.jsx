import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import BrandMark from '../components/BrandMark'
import BrandText from '../components/BrandText'
import { demoMode } from '../lib/api'
import { defaultSettings } from '../data/demoData'
import { AdminOverviewPage } from './AdminOverviewPage'
import { AdminBookingsPage } from './AdminBookingsPage'
import { AdminMenuPage } from './AdminMenuPage'
import { AdminCustomersPage } from './AdminCustomersPage'
import { AdminReportsPage } from './AdminReportsPage'
import { AdminSettingsPage } from './AdminSettingsPage'

const sections = [
  { key: 'overview', title: 'Overview', path: '/admin', icon: 'chart' },
  { key: 'bookings', title: 'Reservations', path: '/admin/bookings', icon: 'calendar' },
  { key: 'menu', title: 'Menu', path: '/admin/menu', icon: 'dish' },
  { key: 'customers', title: 'Customers', path: '/admin/customers', icon: 'users' },
  { key: 'reports', title: 'Reports', path: '/admin/reports', icon: 'chart' },
  { key: 'settings', title: 'Settings', path: '/admin/settings', icon: 'settings' },
]

const pageForPath = (path) => sections.find((item) => item.path === path)?.key || 'overview'

export default function AdminPage({ path, go, user, menu, bookings, customers, report, settings = defaultSettings, onLogout, onBookingStatus, onSaveMenu, onUploadMenuImage, onDeleteMenu, onSaveSettings }) {
  const [mobileNav, setMobileNav] = useState(false)
  const active = pageForPath(path)
  const title = sections.find((section) => section.key === active)?.title || 'Overview'
  const body = useMemo(() => {
    if (active === 'bookings') return <AdminBookingsPage bookings={bookings} onStatus={onBookingStatus} />
    if (active === 'menu') return <AdminMenuPage menu={menu} onSave={onSaveMenu} onUploadImage={onUploadMenuImage} onDelete={onDeleteMenu} />
    if (active === 'customers') return <AdminCustomersPage customers={customers} />
    if (active === 'reports') return <AdminReportsPage report={report} bookings={bookings} />
    if (active === 'settings') return <AdminSettingsPage settings={settings} onSave={onSaveSettings} />
    return <AdminOverviewPage menu={menu} bookings={bookings} report={report} go={go} user={user} />
  }, [active, menu, bookings, customers, report, settings, go, onBookingStatus, onSaveMenu, onUploadMenuImage, onDeleteMenu, onSaveSettings])
  return <div className="admin-shell"><aside className={mobileNav ? 'admin-sidebar mobile-open' : 'admin-sidebar'}><button className="admin-brand" onClick={() => go('/')}><BrandMark /><span><BrandText name={settings.restaurantName} /><small>RESTAURANT DESK</small></span></button><div className="sidebar-caption">WORKSPACE</div><nav className="admin-nav">{sections.map((section) => <button key={section.key} className={active === section.key ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => { setMobileNav(false); go(section.path) }}><Icon name={section.icon} size={18} />{section.title}{section.key === 'bookings' && bookings.some((b) => b.status === 'pending') && <i className="nav-notice">{bookings.filter((b) => b.status === 'pending').length}</i>}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-help"><span className="help-spark">✳</span><strong>A table worth<br />coming back to.</strong><small>Good food starts with a good welcome.</small></div><div className="sidebar-user"><span className="user-avatar">{(user?.name || 'A').split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><div><strong>{user?.name || 'Restaurant owner'}</strong><small>Administrator</small></div><button className="icon-button sidebar-logout" aria-label="Sign out" onClick={onLogout}><Icon name="logout" size={17} /></button></div></div></aside><div className="admin-main"><header className="admin-topbar"><div className="admin-top-left"><button className="admin-mobile-toggle" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle sidebar"><Icon name="menu" /></button><span className="breadcrumb">Workspace <i>/</i> <strong>{title}</strong></span></div><div className="admin-top-right"><span className="open-status"><i /> Front of house</span><span className="topbar-divider" /><button className="icon-button" title="Notifications"><Icon name="bell" size={18} /></button><button className="view-site" onClick={() => go('/')}>View website <Icon name="diagonal" size={15} /></button></div></header><main className="admin-content">{body}<div className="admin-footer"><span>Made for the ones who make it special.</span><span>{settings.restaurantName.toUpperCase()} RESTAURANT DESK &nbsp;·&nbsp; {demoMode ? 'PREVIEW' : 'LIVE'}</span></div></main></div></div>
}
