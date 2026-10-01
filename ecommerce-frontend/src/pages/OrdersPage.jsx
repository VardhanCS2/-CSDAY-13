import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Box, RotateCcw } from 'lucide-react'
import { api, errorMessage, responseData } from '@/api/client'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'

export function OrdersPage() {
  const location = useLocation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')
  const [busyId, setBusyId] = useState(null)

  async function loadOrders() {
    try {
      const response = await api.get('/orders/')
      setOrders(responseData(response) || [])
    } catch (requestError) { setError(errorMessage(requestError)) }
    finally { setLoading(false) }
  }

  useEffect(() => { Promise.resolve().then(loadOrders) }, [])

  async function cancelOrder(orderId) {
    setBusyId(orderId)
    setError('')
    try {
      await api.patch(`/orders/${orderId}/cancel`)
      setNotice(`Order #${orderId} cancelled.`)
      await loadOrders()
    } catch (requestError) { setError(errorMessage(requestError)) }
    finally { setBusyId(null) }
  }

  if (loading) return <main className="route-loading">Loading your orders...</main>

  return (
    <main className="account-page">
      <div className="account-page-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> Kept track of</p><h1>Your orders</h1></div><Link className="text-link" to="/">Shop the collection <ArrowRight size={15} /></Link></div>
      {notice && <div className="notice" role="status">{notice}</div>}
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {!orders.length ? <div className="empty-state cart-empty"><span className="empty-icon"><Box size={22} /></span><h2>No orders to show.</h2><p>Your next favorite thing might be just around the corner.</p><Link className="ui-button ui-button-primary ui-button-default" to="/">Browse the collection <ArrowRight size={15} /></Link></div> : (
        <div className="orders-list">{orders.map((order) => <article className="order-card" key={order.id}>
          <div className="order-heading"><div><p className="order-kicker">Order #{String(order.id).padStart(5, '0')}</p><span>{new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span></div><span className={`order-status ${order.status?.toLowerCase()}`}>{order.status}</span></div>
          <div className="order-lines">{order.items?.map((item) => <div className="order-line" key={item.id}><span>{item.quantity} × Item #{item.product_id}</span><span>{formatPrice(item.price * item.quantity)}</span></div>)}</div>
          <div className="order-footer"><div><span>Total</span><strong>{formatPrice(order.total_amount)}</strong></div>{order.status === 'Pending' && <Button variant="outline" size="sm" disabled={busyId === order.id} onClick={() => cancelOrder(order.id)}><RotateCcw size={14} /> {busyId === order.id ? 'Cancelling...' : 'Cancel order'}</Button>}</div>
        </article>)}</div>
      )}
    </main>
  )
}