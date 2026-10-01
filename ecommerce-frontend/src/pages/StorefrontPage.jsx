import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowRight, ArrowUpDown, Search, ShoppingBag, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage, responseData } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import { ProductImage } from '@/components/ProductImage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'

export function StorefrontPage() {
  const { user, refreshCartCount } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [stock, setStock] = useState('all')
  const [sort, setSort] = useState('recommended')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [addingId, setAddingId] = useState(null)
  const [error, setError] = useState('')
  const pageSize = 12

  useEffect(() => {
    let active = true
    const params = { page, limit: pageSize }
    if (search.trim()) params.search = search.trim()
    if (minPrice !== '') params.min_price = minPrice
    if (maxPrice !== '') params.max_price = maxPrice
    if (stock !== 'all') params.stock_available = stock === 'in'

    api.get('/products/', { params })
      .then((response) => {
        if (!active) return
        const result = responseData(response)
        setProducts(result.items || [])
        setTotal(result.total || 0)
      })
      .catch((requestError) => { if (active) setError(errorMessage(requestError)) })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [search, minPrice, maxPrice, stock, page, reloadKey])

  const sortedProducts = [...products].sort((first, second) => {
    if (sort === 'price-low') return first.price - second.price
    if (sort === 'price-high') return second.price - first.price
    if (sort === 'name') return first.name.localeCompare(second.name)
    return 0
  })

  async function addToBag(product) {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/product/${product.id}` } } })
      return
    }
    setAddingId(product.id)
    setError('')
    try {
      await api.post('/cart/add', null, { params: { product_identifier: String(product.id), quantity: 1 } })
      await refreshCartCount()
      toast.success(`${product.name} added to your bag.`)
    } catch (requestError) {
      toast.error(errorMessage(requestError))
    } finally {
      setAddingId(null)
    }
  }

  function updateFilter(setter, value) {
    setLoading(true)
    setError('')
    setter(value)
    setPage(1)
  }

  return (
    <main>
      <section className="hero-band">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> The considered collection</p>
          <h1>Everyday things.<br /><em>Made a little better.</em></h1>
          <p className="hero-description">Objects for slower mornings, thoughtful gifting, and the small rituals that make a day.</p>
          <a className="hero-link" href="#shop">Explore the collection <ArrowDown size={16} /></a>
          <div className="hero-caption"><span>01 / 03</span><span>Objects with purpose</span></div>
        </div>
        <div className="hero-image-wrap">
          <img src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1500&q=90" alt="Thoughtfully arranged home and lifestyle objects" />
          <div className="hero-image-note"><span>THE DAILY EDIT</span><b>Less, but considered.</b></div>
          <span className="hero-side-label">COMMON GOODS · VOL. 01</span>
        </div>
      </section>

      <section className="shop-section" id="shop">
        <div className="section-heading">
          <div><p className="eyebrow"><span className="eyebrow-line" /> The collection</p><h2>Find your everyday favorite.</h2></div>
          <span className="result-total">{total} {total === 1 ? 'piece' : 'pieces'}</span>
        </div>
        <div className="filter-bar">
          <label className="search-field"><Search size={17} /><Input aria-label="Search products" placeholder="Search the collection" value={search} onChange={(event) => updateFilter(setSearch, event.target.value)} /><kbd>⌕</kbd></label>
          <div className="filter-controls">
            <label className="compact-filter"><span>Price</span><Input aria-label="Minimum price" type="number" min="0" placeholder="Min" value={minPrice} onChange={(event) => updateFilter(setMinPrice, event.target.value)} /><span className="price-divider">to</span><Input aria-label="Maximum price" type="number" min="0" placeholder="Max" value={maxPrice} onChange={(event) => updateFilter(setMaxPrice, event.target.value)} /></label>
            <label className="select-filter"><SlidersHorizontal size={15} /><select aria-label="Availability" value={stock} onChange={(event) => updateFilter(setStock, event.target.value)}><option value="all">Availability</option><option value="in">In stock</option><option value="out">Sold out</option></select></label>
            <label className="select-filter sort-filter"><ArrowUpDown size={15} /><select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option></select></label>
          </div>
        </div>

        {error && <div className="notice notice-error" role="alert">{error}</div>}
        {loading ? <div className="product-grid" aria-label="Loading products">{Array.from({ length: 8 }, (_, index) => <div className="product-skeleton" key={index} />)}</div> : error ? (
          <div className="empty-state"><p className="eyebrow">Connection issue</p><h3>We couldn’t reach the collection.</h3><p>{error}</p><Button onClick={() => { setLoading(true); setReloadKey((key) => key + 1) }}>Try again</Button></div>
        ) : sortedProducts.length ? (
          <div className="product-grid">
            {sortedProducts.map((product, index) => (
              <article className="product-card" key={product.id} style={{ '--card-index': index }}>
                <Link to={`/product/${product.id}`} className="product-image-link" aria-label={`View ${product.name}`}>
                  <ProductImage product={product} className="product-image" />
                  <Badge className={product.stock > 0 ? 'stock-badge' : 'stock-badge sold-out'}>{product.stock > 0 ? 'In stock' : 'Sold out'}</Badge>
                </Link>
                <div className="product-info"><div><Link to={`/product/${product.id}`} className="product-name">{product.name}</Link><p className="product-subtitle">{product.description || 'A considered everyday essential.'}</p></div><strong>{formatPrice(product.price)}</strong></div>
                <Button className="product-add" variant="outline" disabled={product.stock < 1 || addingId === product.id} onClick={() => addToBag(product)}>
                  <ShoppingBag size={15} /> {addingId === product.id ? 'Adding...' : product.stock < 1 ? 'Unavailable' : 'Add to bag'}
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state"><p className="eyebrow">Nothing here just yet</p><h3>No pieces match those filters.</h3><p>Try a different search or reset your price range.</p><Button variant="outline" onClick={() => { setSearch(''); setMinPrice(''); setMaxPrice(''); setStock('all') }}>Clear filters <ArrowRight size={15} /></Button></div>
        )}

        {total > pageSize && <div className="pagination"><span>Page {page} of {Math.ceil(total / pageSize)}</span><div><Button variant="outline" size="sm" disabled={page === 1} onClick={() => { setLoading(true); setPage((value) => value - 1) }}>Previous</Button><Button variant="outline" size="sm" disabled={page >= Math.ceil(total / pageSize)} onClick={() => { setLoading(true); setPage((value) => value + 1) }}>Next <ArrowRight size={14} /></Button></div></div>}
      </section>
      <section className="promise-strip"><span>Thoughtfully sourced</span><i /><span>Made to be kept</span><i /><span>Here for the everyday</span></section>
    </main>
  )
}