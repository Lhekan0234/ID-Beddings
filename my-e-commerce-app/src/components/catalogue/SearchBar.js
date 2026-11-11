import './SearchBar.css';

/** Controlled search input with an accessible label. */
export default function SearchBar({ value, onChange, placeholder = 'Search products…' }) {
  return (
    <div className="search-bar">
      <label htmlFor="product-search" className="sr-only">
        Search products
      </label>
      <input
        id="product-search"
        type="search"
        className="search-bar__input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </div>
  );
}
