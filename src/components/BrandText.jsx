export default function BrandText({ name }) {
  if ((name || '').toLowerCase() === 'dinenova') {
    return <><span className="brand-dine">Dine</span><span className="brand-nova">Nova</span></>
  }
  return name
}
