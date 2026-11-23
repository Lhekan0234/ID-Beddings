import { useEffect, useState } from 'react';
import {
  createAdminCollection,
  createAdminProduct,
  getAdminCollections,
  getAdminProducts,
  updateAdminProduct,
} from '../../api/client';
import { formatPrice } from '../../utils/format';
import Button from '../ui/Button';

const EMPTY_PRODUCT = {
  name: '',
  description: '',
  collectionId: '',
  price: '',
  sizes: '',
  firmness: '',
  stockStatus: 'TBD',
  stockQuantity: '',
  images: '',
  isNewArrival: false,
};

const splitList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/** Add/edit products, collections, prices, stock, images and archive state. */
export default function AdminProducts() {
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [collectionForm, setCollectionForm] = useState({ name: '', slug: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [collectionData, productData] = await Promise.all([
      getAdminCollections(),
      getAdminProducts(),
    ]);
    const nextCollections = Array.isArray(collectionData?.collections)
      ? collectionData.collections
      : [];
    setCollections(nextCollections);
    setProducts(Array.isArray(productData?.products) ? productData.products : []);
    setForm((current) => ({
      ...current,
      collectionId: current.collectionId || nextCollections[0]?.id || '',
    }));
  };

  useEffect(() => {
    let active = true;
    load().catch((requestError) => {
      if (active) setError(requestError.message);
    });
    return () => {
      active = false;
    };
  }, []);

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setNotice('');
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await createAdminProduct({
        name: form.name.trim(),
        description: form.description.trim(),
        collectionId: form.collectionId,
        price: Number(form.price),
        sizes: splitList(form.sizes),
        firmness: splitList(form.firmness),
        audiences: ['adult'],
        stockStatus: form.stockStatus,
        stockQuantity: form.stockQuantity === '' ? null : Number(form.stockQuantity),
        images: splitList(form.images),
        isNewArrival: form.isNewArrival,
        isBestSeller: false,
        isArchived: false,
      });
      setNotice('Product added. It remains a placeholder in the storefront until real data is supplied.');
      setForm({ ...EMPTY_PRODUCT, collectionId: form.collectionId });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateCollection = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await createAdminCollection({
        name: collectionForm.name.trim(),
        slug: collectionForm.slug.trim(),
      });
      setNotice('Collection created.');
      setCollectionForm({ name: '', slug: '' });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleArchive = async (product) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await updateAdminProduct(product.id, { isArchived: !product.isArchived });
      setNotice(`${product.name} ${product.isArchived ? 'restored' : 'archived'}.`);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-card">
      <h2>Products</h2>
      <p className="admin-form__note">
        Only products supplied here are real. The storefront's demo catalogue is
        clearly labelled as placeholders until verified data is entered.
      </p>

      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      {notice ? <p className="admin-form__note" role="status">{notice}</p> : null}

      <details>
        <summary>Add a product</summary>
        <form className="admin-form" onSubmit={handleCreateProduct}>
          <div className="admin-form__grid">
            <label>Name<input value={form.name} onChange={update('name')} required minLength={2} /></label>
            <label>
              Collection
              <select value={form.collectionId} onChange={update('collectionId')} required>
                <option value="">Choose a collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>{collection.name}</option>
                ))}
              </select>
            </label>
            <label>Price (NGN)<input type="number" min="0" value={form.price} onChange={update('price')} required /></label>
            <label>
              Stock status
              <select value={form.stockStatus} onChange={update('stockStatus')}>
                <option value="TBD">To be confirmed</option>
                <option value="In stock">In stock</option>
                <option value="Out of stock">Out of stock</option>
              </select>
            </label>
            <label>Stock quantity<input type="number" min="0" value={form.stockQuantity} onChange={update('stockQuantity')} /></label>
            <label>Sizes (comma separated)<input value={form.sizes} onChange={update('sizes')} /></label>
            <label>Firmness (comma separated)<input value={form.firmness} onChange={update('firmness')} /></label>
            <label>Image URLs (comma separated)<input value={form.images} onChange={update('images')} /></label>
          </div>
          <label>Description<textarea rows="3" value={form.description} onChange={update('description')} required minLength={10} /></label>
          <label className="admin-form__note">
            <input type="checkbox" checked={form.isNewArrival} onChange={update('isNewArrival')} /> Mark as new arrival
          </label>
          <Button type="submit" disabled={busy}>Add product</Button>
        </form>
      </details>

      <details>
        <summary>Manage collections</summary>
        <form className="admin-form__grid" onSubmit={handleCreateCollection}>
          <label>Collection name<input value={collectionForm.name} onChange={(event) => setCollectionForm({ ...collectionForm, name: event.target.value })} required minLength={2} /></label>
          <label>Slug<input value={collectionForm.slug} onChange={(event) => setCollectionForm({ ...collectionForm, slug: event.target.value })} required pattern="[a-z0-9-]+" /></label>
          <div className="admin-filters__actions"><Button type="submit" disabled={busy}>Add collection</Button></div>
        </form>
        <ul className="admin-detail-list">
          {collections.map((collection) => (
            <li key={collection.id}>
              <span>{collection.name}</span>
              <span className="admin-badge">{collection.productCount} products</span>
            </li>
          ))}
        </ul>
      </details>

      <h3>Catalogue ({products.length})</h3>
      {products.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Collection</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Images</th>
                <th>State</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.collectionName || product.collection}</td>
                  <td>{product.price === null ? 'Price TBD' : formatPrice(product.price)}</td>
                  <td>{product.stockStatus}</td>
                  <td>{product.images.length}</td>
                  <td><span className="admin-badge">{product.isArchived ? 'Archived' : 'Live'}</span></td>
                  <td>
                    <Button type="button" variant="secondary" disabled={busy} onClick={() => toggleArchive(product)}>
                      {product.isArchived ? 'Restore' : 'Archive'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">No products have been entered yet.</p>
      )}
    </div>
  );
}
