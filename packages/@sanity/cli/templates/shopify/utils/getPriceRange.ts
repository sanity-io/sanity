import {DEFAULT_CURRENCY_CODE} from '../constants'

type PriceObject = {
  minVariantPrice: number
  maxVariantPrice: number
}

const formatNumber = (val: number) => {
  return new Intl.NumberFormat('en', {
    currency: DEFAULT_CURRENCY_CODE,
    style: 'currency',
  }).format(val)
}

export const getPriceRange = (price: PriceObject) => {
  if (!price || typeof price?.minVariantPrice === 'undefined') {
    return 'No price found'
  }
  if (price.maxVariantPrice && price.minVariantPrice !== price.maxVariantPrice) {
    return `${formatNumber(price.minVariantPrice)} – ${formatNumber(price.maxVariantPrice)}`
  }

  return formatNumber(price.minVariantPrice)
}
