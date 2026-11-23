import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Recommendation from './pages/Recommendation';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentCallback from './pages/PaymentCallback';
import TrackOrder from './pages/TrackOrder';
import Account from './pages/Account';
import Admin from './pages/Admin';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

/**
 * Route definitions for the ID Beddings and More storefront.
 * Routing is provided by react-router-dom v6 (wrapped in <BrowserRouter> in
 * index.js). The <Layout> shell (header + footer) wraps every route, and the
 * cart provider makes basket state available to the header and pages.
 */
export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="collections" element={<Collections />} />
          <Route path="collections/:collectionSlug" element={<CollectionDetail />} />
          <Route path="shop" element={<Catalog />} />
          <Route path="products/:productId" element={<ProductDetail />} />
          <Route path="find-your-mattress" element={<Recommendation />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="payment/callback" element={<PaymentCallback />} />
          <Route path="track" element={<TrackOrder />} />
          <Route path="account" element={<Account />} />
          <Route path="admin" element={<Admin />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </CartProvider>
  );
}
