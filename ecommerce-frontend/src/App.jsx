import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { StoreLayout } from '@/components/StoreLayout'
import { AuthPage } from '@/pages/AuthPage'
import { AdminPage } from '@/pages/AdminPage'
import { CartPage } from '@/pages/CartPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { ProductDetailPage } from '@/pages/ProductDetailPage'
import { StorefrontPage } from '@/pages/StorefrontPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<StoreLayout />}>
            <Route index element={<StorefrontPage />} />
            <Route path="product/:productId" element={<ProductDetailPage />} />
            <Route path="login" element={<AuthPage mode="login" />} />
            <Route path="register" element={<AuthPage mode="register" />} />
            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="cart" element={<CartPage />} />
              <Route path="orders" element={<OrdersPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
