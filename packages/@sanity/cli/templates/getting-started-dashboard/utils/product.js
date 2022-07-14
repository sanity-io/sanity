export function getPriceRangeFromVariants(variants) {
  const priceRangeMin = Math.min(Object.values(variants).map((variant) => variant.price))
  const priceRangeMax = Math.max(Object.values(variants).map((variant) => variant.price))
  const singlePrice = variants?.[0]?.price
  const priceRange =
    priceRangeMax > priceRangeMin
      ? `$${priceRangeMin} - $${priceRangeMax}`
      : singlePrice
      ? `$${priceRangeMax}`
      : 'No price set'

  return priceRange
}

export function getPriceRangeFromProducts(products = []) {
  const productPrices = products
    .map((product) => {
      return (product?.variants || []).map((variant) => variant.price)
    })
    .reduce((acc, curr) => {
      return acc.concat(curr)
    })

  const priceRangeMin = Math.min(...productPrices)
  const priceRangeMax = Math.max(...productPrices)

  const singlePrice = productPrices?.[0]
  const priceRange =
    priceRangeMax > priceRangeMin
      ? `$${priceRangeMin} - $${priceRangeMax}`
      : singlePrice
      ? `$${priceRangeMax}`
      : 'No price set'

  return priceRange
}
