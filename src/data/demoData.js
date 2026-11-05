export const demoMenu = [
  { id: 'm1', name: 'Burrata & Heirloom Tomato', category: 'Starters', description: 'Silky fresh burrata rests on peak-season heirloom tomatoes, finished with basil oil, cracked pepper, and grilled sourdough.', price: 14, image: 'photo-1608039829572-78524f79c4c7', featured: true, isAvailable: true },
  { id: 'm2', name: 'Wild Mushroom Ravioli', category: 'Mains', description: 'Hand-folded ravioli filled with wild mushrooms, tossed in nutty sage brown butter and finished with aged Parmesan.', price: 24, image: 'photo-1473093295043-cdd812d0e601', featured: true, isAvailable: true },
  { id: 'm3', name: 'Wood-Fired Margherita', category: 'Mains', description: 'A blistered wood-fired crust topped with sweet San Marzano tomato, creamy fior di latte, fresh basil, and extra-virgin olive oil.', price: 19, image: 'photo-1579751626657-72bc17010498', featured: true, isAvailable: true },
  { id: 'm4', name: 'Crispy Calamari', category: 'Starters', description: 'Lightly crisp calamari served with lemon, fresh parsley, and our slow-simmered house marinara for dipping.', price: 13, image: 'photo-1599487488170-d11ec9c172f0', featured: false, isAvailable: true },
  { id: 'm5', name: 'Sunday Gravy Rigatoni', category: 'Mains', description: 'Slow-braised short rib in our Sunday tomato gravy, folded through rigatoni and finished with freshly grated pecorino.', price: 26, image: 'photo-1551183053-bf91a1d81141', featured: true, isAvailable: true },
  { id: 'm6', name: 'Lemon Olive Oil Cake', category: 'Desserts', description: 'Moist olive oil cake with bright lemon, soft mascarpone cream, and a handful of seasonal berries.', price: 11, image: 'photo-1488477181946-6428a0291777', featured: false, isAvailable: true },
  { id: 'm7', name: 'Baked Gnocchi', category: 'Mains', description: 'Pillowy potato gnocchi baked in rich tomato fondue with melted mozzarella and sweet basil.', price: 22, image: 'photo-1551183053-bf91a1d81141', featured: false, isAvailable: true },
  { id: 'm8', name: 'Affogato', category: 'Desserts', description: 'Vanilla bean gelato meets a hot double espresso, finished with a delicate amaretti crumble.', price: 9, image: 'photo-1511920170033-f8396924c348', featured: false, isAvailable: true },
]

export const demoBookings = [
  { id: 'b1', customerName: 'Olivia Martin', email: 'olivia@example.com', phone: '+1 (555) 012-4389', date: '2026-11-02', time: '19:00', guests: 4, occasion: 'Birthday', status: 'confirmed', createdAt: '2026-11-01T10:22:00Z' },
  { id: 'b2', customerName: 'Daniel Kim', email: 'daniel@example.com', phone: '+1 (555) 017-2041', date: '2026-11-02', time: '19:30', guests: 2, occasion: 'Date night', status: 'pending', createdAt: '2026-11-01T12:40:00Z' },
  { id: 'b3', customerName: 'Ava Thompson', email: 'ava@example.com', phone: '+1 (555) 013-6127', date: '2026-11-03', time: '18:00', guests: 6, occasion: 'Family dinner', status: 'confirmed', createdAt: '2026-11-01T14:05:00Z' },
  { id: 'b4', customerName: 'Noah Williams', email: 'noah@example.com', phone: '+1 (555) 018-9014', date: '2026-11-03', time: '20:00', guests: 2, occasion: 'Anniversary', status: 'pending', createdAt: '2026-11-01T16:15:00Z' },
  { id: 'b5', customerName: 'Mia Patel', email: 'mia@example.com', phone: '+1 (555) 016-7720', date: '2026-11-04', time: '18:30', guests: 3, occasion: 'Dinner', status: 'confirmed', createdAt: '2026-10-31T09:15:00Z' },
]

export const defaultSettings = {
  restaurantName: 'DineNova',
  tagline: 'Good Food. Great Mood.',
  description: 'A new experience of dining, with memorable food, warm service, and a table ready for you.',
  phone: '(212) 555-0198',
  email: 'support@seasoned.com',
  address: '18 Orchard Street, New York, NY 10002',
  hours: 'Open 24 hours, 7 days a week',
  instagram: '',
  facebook: '',
}

const previousDemoDescriptions = {
  m1: 'Creamy burrata, summer tomatoes, basil oil, grilled sourdough.',
  m2: 'Hand-folded pasta, roasted mushrooms, sage brown butter, parmesan.',
  m3: 'San Marzano tomato, fior di latte, fresh basil, olive oil.',
  m4: 'Lightly fried calamari, lemon, parsley, house marinara.',
  m5: 'Slow-braised short rib ragu, rigatoni, pecorino romano.',
  m6: 'Citrus-soaked cake, mascarpone cream, seasonal berries.',
  m7: 'Pillowy potato gnocchi, tomato fondue, mozzarella, basil.',
  m8: 'Vanilla bean gelato, double espresso, amaretti crumb.',
}

function updateDemoMenuDescriptions(items) {
  return items.map((item) => {
    const seededItem = demoMenu.find((seed) => seed.id === item.id)
    if (!seededItem || item.description !== previousDemoDescriptions[item.id]) {
      return item
    }
    return { ...item, description: seededItem.description }
  })
}

export function readDemoState() {
  try {
    const saved = JSON.parse(localStorage.getItem('seasoned-demo-state') || '{}')
    const settings = { ...defaultSettings, ...(saved.settings || {}) }
    const menu = Array.isArray(saved.menu) ? saved.menu : demoMenu
    if (settings.restaurantName === 'Seasoned') settings.restaurantName = defaultSettings.restaurantName
    if (settings.tagline === 'Good food. Good company.') settings.tagline = defaultSettings.tagline
    if (settings.email === 'hello@seasoned.example') {
      settings.email = defaultSettings.email
    }
    return {
      menu: updateDemoMenuDescriptions(menu),
      bookings: Array.isArray(saved.bookings) ? saved.bookings : demoBookings,
      settings,
      user: saved.user || null,
      pendingVerification: saved.pendingVerification || null,
      accounts: Array.isArray(saved.accounts) ? saved.accounts : [],
    }
  } catch {
    return { menu: demoMenu, bookings: demoBookings, settings: defaultSettings, user: null, accounts: [] }
  }
}

export function writeDemoState(nextState) {
  localStorage.setItem('seasoned-demo-state', JSON.stringify(nextState))
}
