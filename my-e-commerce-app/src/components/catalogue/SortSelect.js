import './SortSelect.css';

const options = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'newest', label: 'Newest' },
];

/** Controlled sort dropdown. */
export default function SortSelect({ value, onChange }) {
  return (
    <div className="sort-select">
      <label htmlFor="sort-products">Sort by</label>
      <select id="sort-products" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
