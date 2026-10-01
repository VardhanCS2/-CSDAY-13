import { useEffect, useState } from 'react'
import { CheckCircle2, ClipboardList, ImagePlus, PackagePlus, Pencil, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage, responseData } from '@/api/client'
import { ProductImage } from '@/components/ProductImage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'
import { productSchema } from '@/lib/validation'
import { useAuth } from '@/hooks/useAuth'

const emptyProduct = { name: '', description: '', price: '', stock: '', image: null }

export function AdminPage() {
  const { user } = useAuth()
  const [section, setSection] = useState('orders')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState(emptyProduct)
  const [error, setError] = useState('')
  const [busyOrder, setBusyOrder] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([
      api.get('/orders/admin/all'),
      api.get('/products/', { params: { page: 1, limit: 100 } }),
    ])
      .then(([ordersResponse, productsResponse]) => {
        if (!active) return
        setOrders(responseData(ordersResponse) || [])
        setProducts(responseData(productsResponse)?.items || [])
      })
      .catch((requestError) => { if (active) setError(errorMessage(requestError)) })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [reloadKey])

  function changeSection(value) {
    setError('')
    setFormOpen(false)
    setSection(value)
  }

  function beginCreate() {
    setFormOpen(true)
    setEditingProduct(null)
    setForm(emptyProduct)
    setError('')
  }

  function beginEdit(product) {
    setFormOpen(true)
    setEditingProduct(product)
    setForm({ name: product.name, description: product.description || '', price: String(product.price), stock: String(product.stock), image: null })
    setError('')
  }

  async function saveProduct(event) {
    event.preventDefault()
    const parsed = productSchema.safeParse(form)
    if (!parsed.success) {
      const issues = Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message]))
      setError(Object.values(issues)[0])
      toast.error(Object.values(issues)[0])
      return
    }

    setSaving(true)
    setError('')
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, {
          name: parsed.data.name,
          description: parsed.data.description || null,
          price: parsed.data.price,
          stock: parsed.data.stock,
        })
        toast.success('Product updated successfully.')
      } else {
        const payload = new FormData()
        payload.append('name', parsed.data.name)
        payload.append('description', parsed.data.description)
        payload.append('price', String(parsed.data.price))
        payload.append('stock', String(parsed.data.stock))
        if (form.image) payload.append('image', form.image)
        await api.post('/products/', payload)
        toast.success('Product created successfully.')
      }
      setEditingProduct(null)
      setForm(emptyProduct)
      setFormOpen(false)
      setLoading(true)
      setReloadKey((value) => value + 1)
    } catch (requestError) {
      const message = errorMessage(requestError)
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Remove “${product.name}” from the catalog?`)) return
    setError('')
    try {
      await api.delete(`/products/${product.id}`)
      setProducts((items) => items.filter((item) => item.id !== product.id))
      toast.success('Product removed successfully.')
    } catch (requestError) {
      const message = errorMessage(requestError)
      setError(message)
      toast.error(message)
    }
  }

  async function cancelOrder(order) {
    setBusyOrder(order.id)
    setError('')
    try {
      await api.patch(`/orders/${order.id}/cancel`)
      setOrders((items) => items.map((item) => item.id === order.id ? { ...item, status: 'Cancelled' } : item))
      toast.success(`Order #${order.id} cancelled.`)
    } catch (requestError) {
      const message = errorMessage(requestError)
      setError(message)
      toast.error(message)
    } finally {
      setBusyOrder(null)
    }
  }

  async function completeOrder(order) {
    setBusyOrder(order.id)
    setError('')
    try {
      await api.patch(`/orders/${order.id}/complete`)
      setOrders((items) => items.map((item) => item.id === order.id ? { ...item, status: 'Completed' } : item))
      toast.success(`Order #${order.id} marked completed.`)
    } catch (requestError) {
      const message = errorMessage(requestError)
      setError(message)
      toast.error(message)
    } finally {
      setBusyOrder(null)
    }
  }

  const pendingCount = orders.filter((order) => order.status === 'Pending').length
  const orderRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)

  return (
    <main className="admin-page">
      <div className="admin-heading">
        <div><p className="eyebrow"><span className="eyebrow-line" /> Store management</p><h1>Admin dashboard</h1><p className="admin-welcome">Signed in as {user?.name} · administrator</p></div>
        <span className="admin-role-mark"><ShieldCheck size={17} /> Admin access</span>
      </div>

      <div className="admin-metrics">
        <div><span>All orders</span><strong>{orders.length}</strong><small>Across every customer</small></div>
        <div><span>Pending</span><strong>{pendingCount}</strong><small>Awaiting fulfillment</small></div>
        <div><span>Order value</span><strong>{formatPrice(orderRevenue)}</strong><small>Recorded order totals</small></div>
        <div><span>Catalog</span><strong>{products.length}</strong><small>Products currently listed</small></div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
          <button role="tab" aria-selected={section === 'orders'} className={section === 'orders' ? 'selected' : ''} onClick={() => changeSection('orders')}><ClipboardList size={15} /> All orders</button>
          <button role="tab" aria-selected={section === 'products'} className={section === 'products' ? 'selected' : ''} onClick={() => changeSection('products')}><PackagePlus size={15} /> Products</button>
        </div>
        <div className="admin-actions">
          {section === 'products' && <Button size="sm" onClick={beginCreate}><PackagePlus size={14} /> Add product</Button>}
          <Button variant="outline" size="sm" aria-label="Refresh admin data" title="Refresh" onClick={() => { setLoading(true); setReloadKey((value) => value + 1) }}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      {error && <div className="notice notice-error" role="alert">{error}</div>}

      {section === 'products' && formOpen && (
        <form className="admin-product-form" onSubmit={saveProduct}>
          <div className="admin-form-title"><div><p className="eyebrow">Catalog item</p><h2>{editingProduct ? `Edit ${editingProduct.name}` : 'New product'}</h2></div><button className="icon-button" type="button" aria-label="Close product form" onClick={() => { setFormOpen(false); setEditingProduct(null); setForm(emptyProduct) }}><X size={17} /></button></div>
          <div className="admin-form-grid">
            <label className="form-field"><span>Name</span><Input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required maxLength={100} /></label>
            <label className="form-field"><span>Price</span><Input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))} required /></label>
            <label className="form-field"><span>Stock</span><Input type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm((value) => ({ ...value, stock: event.target.value }))} required /></label>
            <label className="form-field admin-description"><span>Description</span><Input value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></label>
            {!editingProduct && <label className="form-field admin-image-field"><span>Product image</span><span className="file-input-wrap"><ImagePlus size={15} /><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setForm((value) => ({ ...value, image: event.target.files?.[0] || null }))} /><small>{form.image?.name || 'Choose JPG, PNG, or WEBP'}</small></span></label>}
          </div>
          <div className="admin-form-actions"><Button type="button" variant="outline" onClick={beginCreate}>Clear</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingProduct ? 'Save changes' : 'Create product'}</Button></div>
        </form>
      )}

      {loading ? <div className="route-loading admin-loading">Loading {section}...</div> : section === 'orders' ? (
        <section className="admin-table-wrap" aria-label="All customer orders">
          {orders.length ? <table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Action</th></tr></thead><tbody>
            {orders.map((order) => <tr key={order.id}><td className="admin-order-id">#{String(order.id).padStart(5, '0')}</td><td><div className="admin-customer-cell"><strong>{order.customer?.name || `Customer #${order.user_id}`}</strong>{order.customer?.email && <small>{order.customer.email}</small>}</div></td><td>{order.items?.map((item) => `${item.quantity} × ${item.product_name || `Product #${item.product_id}`}`).join(', ') || 'No items'}</td><td>{formatPrice(order.total_amount)}</td><td><Badge className={`admin-status ${order.status?.toLowerCase()}`}>{order.status}</Badge></td><td>{new Date(order.created_at).toLocaleDateString()}</td><td>{order.status === 'Pending' ? <div className="admin-order-actions"><Button className="complete-order-button" variant="outline" size="sm" disabled={busyOrder === order.id} onClick={() => completeOrder(order)}><CheckCircle2 size={13} /> {busyOrder === order.id ? 'Updating...' : 'Complete'}</Button><Button variant="outline" size="sm" disabled={busyOrder === order.id} onClick={() => cancelOrder(order)}>{busyOrder === order.id ? 'Updating...' : 'Cancel'}</Button></div> : <span className="admin-muted">—</span>}</td></tr>)}
          </tbody></table> : <div className="admin-empty">There are no orders yet.</div>}
        </section>
      ) : (
        <section className="admin-table-wrap" aria-label="Product catalog management">
          {products.length ? <table className="admin-table"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Owner</th><th>Actions</th></tr></thead><tbody>
            {products.map((product) => <tr key={product.id}><td><div className="admin-product-cell"><ProductImage product={product} className="admin-product-thumbnail" /><div><strong>{product.name}</strong><small>{product.description || 'No description'}</small></div></div></td><td>{formatPrice(product.price)}</td><td>{product.stock}</td><td>#{product.owner_id}</td><td><div className="admin-row-actions"><Button variant="outline" size="sm" aria-label={`Edit ${product.name}`} title="Edit product" onClick={() => beginEdit(product)}><Pencil size={14} /></Button><Button variant="outline" size="sm" aria-label={`Delete ${product.name}`} title="Delete product" onClick={() => deleteProduct(product)}><Trash2 size={14} /></Button></div></td></tr>)}
          </tbody></table> : <div className="admin-empty">No products in the catalog yet.</div>}
        </section>
      )}
    </main>
  )
}