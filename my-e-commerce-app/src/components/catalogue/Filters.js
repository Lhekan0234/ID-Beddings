import { collections, firmnessOptions, sizeOptions } from '../../data/products';
import './Filters.css';

/**
 * Catalogue filter controls. Fully controlled via `value` + `onChange`.
 * Each <select> has an associated <label> for accessibility.
 */
export default function Filters({ value, onChange }) {
  const update = (field) => (e) => {
    onChange({ ...value, [field]: e.target.value });
  };

  return (
    <div className="filters">
      <div className="filters__field">
        <label htmlFor="filter-collection">Collection</label>
        <select id="filter-collection" value={value.collection} onChange={update('collection')}>
          <option value="">All collections</option>
          {collections.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="filters__field">
        <label htmlFor="filter-firmness">Firmness</label>
        <select id="filter-firmness" value={value.firmness} onChange={update('firmness')}>
          <option value="">Any firmness</option>
          {firmnessOptions.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      <div className="filters__field">
        <label htmlFor="filter-size">Size</label>
        <select id="filter-size" value={value.size} onChange={update('size')}>
          <option value="">{sizeOptions.length ? 'Any size' : 'Sizes coming soon'}</option>
          {sizeOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="filters__field filters__field--check">
        <input
          id="filter-instock"
          type="checkbox"
          checked={value.inStockOnly}
          onChange={(e) => onChange({ ...value, inStockOnly: e.target.checked })}
        />
        <label htmlFor="filter-instock">In stock only</label>
      </div>
    </div>
  );
}
