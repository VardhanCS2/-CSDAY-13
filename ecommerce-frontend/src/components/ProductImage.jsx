const productImages = [
  'photo-1505740420928-5e560c06d30e',
  'photo-1548036328-c9fa89d128fa',
  'photo-1602143407151-7111542de6e8',
  'photo-1523275335684-37898b6baf30',
  'photo-1570222094114-d054a817e56b',
  'photo-1603006905003-be475563bc59',
  'photo-1503602642458-232111445657',
]

export function ProductImage({ product, className = '' }) {
  const remoteImage = typeof product.image_url === 'string' && /^https?:\/\//.test(product.image_url)
    ? product.image_url
    : null
  const storedPath = typeof product.image_url === 'string' && !remoteImage
    ? product.image_url.replace(/^\/?app\//, '').replace(/^\//, '')
    : null
  const fallbackImage = `https://images.unsplash.com/${productImages[Math.abs(Number(product.id) || 0) % productImages.length]}?auto=format&fit=crop&w=900&q=85`
  const imageUrl = remoteImage || (storedPath ? `/api/${storedPath}` : fallbackImage)

  return (
    <img
      className={className}
      src={imageUrl}
      alt={product.name}
      loading="lazy"
      onError={(event) => { event.currentTarget.src = fallbackImage }}
    />
  )
}