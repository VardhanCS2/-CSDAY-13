import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage, responseData } from '@/api/client'
import { ProductImage } from '@/components/ProductImage'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'

export function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user, refreshCartCount } = useAuth()
  const [result, setResult] = useState({ productId: null, product: null, error: '' })
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get(`/products/${productId}`)
      .then((response) => { if (active) setResult({ productId, product: responseData(response), error: '' }) })
      .catch((requestError) => { if (active) setResult({ productId, product: null, error: errorMessage(requestError) }) })
    return () => { active = false }
  }, [productId])

  async function addToBag() {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/product/${productId}` } } })
      return
    }
    setAdding(true)
    setError('')
    try {
      await api.post('/cart/add', null, { params: { product_identifier: String(product.id), quantity } })
      await refreshCartCount()
      toast.success(`${product.name} added to your bag.`)
    } catch (requestError) {
      const message = errorMessage(requestError)
      setError(message)
      toast.error(message)
    } finally {
      setAdding(false)
    }
  }

  const loading = result.productId !== productId
  const product = loading ? null : result.product
  const loadError = loading ? '' : result.error
  if (loading) return <main className="route-loading">Loading product...</main>
  if (!product) return <main className="empty-state detail-not-found"><p className="eyebrow">Product not found</p><h2>{loadError || 'This piece may have moved.'}</h2><Link className="text-link" to="/">Back to the collection</Link></main>

  return (
    <main className="detail-page">
      <Link className="back-link" to="/"><ArrowLeft size={15} /> Back to the collection</Link>
      <div className="detail-layout">
        <div className="detail-image"><ProductImage product={product} className="detail-photo" /><span className="image-index">COMMON GOODS / {String(product.id).padStart(2, '0')}</span></div>
        <section className="detail-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> A daily essential</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatPrice(product.price)}</p>
          <div className="detail-divider" />
          <p className="detail-description">{product.description || 'Designed with intention and made for the everyday. A useful, lasting addition to your home and routine.'}</p>
          <div className="detail-stock"><span className={product.stock > 0 ? 'stock-dot' : 'stock-dot sold-out'} />{product.stock > 0 ? `${product.stock} available` : 'Currently unavailable'}</div>
          <div className="purchase-controls"><div className="quantity-stepper" aria-label="Quantity"><button disabled={quantity <= 1} onClick={() => setQuantity((value) => value - 1)} aria-label="Decrease quantity"><Minus size={15} /></button><span>{quantity}</span><button disabled={quantity >= product.stock} onClick={() => setQuantity((value) => value + 1)} aria-label="Increase quantity"><Plus size={15} /></button></div><Button className="detail-add" disabled={product.stock < 1 || adding} onClick={addToBag}><ShoppingBag size={17} />{adding ? 'Adding...' : 'Add to bag'}</Button></div>
          {error && <p className="form-message error-text" role="alert">{error}</p>}
          <div className="product-meta"><div><span>Good to know</span><Badge>{product.stock > 0 ? 'Ready to ship' : 'Restocking soon'}</Badge></div><div><span>Product number</span><b>CG-{String(product.id).padStart(4, '0')}</b></div></div>
        </section>
      </div>
    </main>
  )
}