import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage, responseData } from '@/api/client'
import { ProductImage } from '@/components/ProductImage'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'

export function CartPage() {
  const navigate = useNavigate()
  const { refreshCartCount } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function loadCart() {
    try {
      const response = await api.get('/cart/')
      setItems(responseData(response) || [])
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { Promise.resolve().then(loadCart) }, [])

  async function changeQuantity(productId, quantity) {
    setBusy(true)
    setError('')
    try {
      await api.put('/cart/edit', null, { params: { product_id: productId, quantity } })
      await loadCart()
      await refreshCartCount()
    } catch (requestError) { setError(errorMessage(requestError)) }
    finally { setBusy(false) }
  }

  async function removeItem(productId) {
    setBusy(true)
    setError('')
    try {
      await api.delete(`/cart/remove/${productId}`)
      await loadCart()
      await refreshCartCount()
    } catch (requestError) { setError(errorMessage(requestError)) }
    finally { setBusy(false) }
  }

  async function checkout() {
    setBusy(true)
    setError('')
    try {
      await api.post('/orders/')
      await refreshCartCount()
      toast.success('Order placed successfully.')
      navigate('/orders')
    } catch (requestError) {
      const message = errorMessage(requestError)
      setError(message)
      toast.error(message)
    }
    finally { setBusy(false) }
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.total_price || item.price * item.quantity), 0)
  if (loading) return <main className="route-loading">Loading your bag...</main>

  return (
    <main className="account-page">
      <Link className="back-link" to="/"><ArrowLeft size={15} /> Continue browsing</Link>
      <div className="account-page-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> Your selection</p><h1>Your bag<span className="heading-count">{items.length}</span></h1></div><span className="result-total">{items.reduce((sum, item) => sum + item.quantity, 0)} items</span></div>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {!items.length ? <div className="empty-state cart-empty"><span className="empty-icon"><ShoppingBag size={22} /></span><h2>Your bag is taking a breather.</h2><p>Find a few everyday favorites and they’ll be waiting here.</p><Link className="ui-button ui-button-primary ui-button-default" to="/">Explore the collection <ArrowRight size={15} /></Link></div> : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => <article className="cart-item" key={item.product_id}>
              <Link to={`/product/${item.product_id}`} className="cart-item-image"><ProductImage product={{ id: item.product_id, name: item.name }} className="product-image" /></Link>
              <div className="cart-item-description"><Link to={`/product/${item.product_id}`} className="product-name">{item.name}</Link><p>{item.description || 'A considered everyday essential.'}</p><button className="remove-link" disabled={busy} onClick={() => removeItem(item.product_id)}><Trash2 size={13} /> Remove</button></div>
              <div className="cart-item-controls"><strong>{formatPrice(item.total_price || item.price * item.quantity)}</strong><div className="quantity-stepper"><button disabled={busy || item.quantity <= 1} onClick={() => changeQuantity(item.product_id, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}><Minus size={13} /></button><span>{item.quantity}</span><button disabled={busy} onClick={() => changeQuantity(item.product_id, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}><Plus size={13} /></button></div></div>
            </article>)}
          </div>
          <aside className="order-summary"><p className="eyebrow">At a glance</p><div className="summary-row"><span>Subtotal</span><b>{formatPrice(subtotal)}</b></div><div className="summary-row"><span>Shipping</span><span>Calculated at checkout</span></div><div className="summary-total"><span>Total</span><b>{formatPrice(subtotal)}</b></div><Button className="checkout-button" disabled={busy || !items.length} onClick={checkout}>{busy ? 'Working...' : 'Place order'}<ArrowRight size={16} /></Button><p className="summary-note">Shipping and payment are handled by your store setup.</p></aside>
        </div>
      )}
    </main>
  )
}