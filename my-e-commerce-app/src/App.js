import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

/**
 * Route definitions for the ID Beddings and More storefront.
 * Routing is provided by react-router-dom v6 (wrapped in <BrowserRouter> in
 * index.js). The <Layout> shell (header + footer) wraps every route.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="collections" element={<Collections />} />
        <Route path="collections/:collectionSlug" element={<CollectionDetail />} />
        <Route path="shop" element={<Catalog />} />
        <Route path="products/:productId" element={<ProductDetail />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

