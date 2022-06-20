import React, {useMemo} from 'react'
import {GridList} from '../components'

export function Products({heading, products = []}) {
  const productListItems = useMemo(
    () =>
      products?.filter(Boolean).map((product) => ({
        _id: product._id,
        title: product.name,
        image: product?.variants?.[0].picture,
      })),
    [products]
  )

  return <GridList heading={heading} items={productListItems} />
}
