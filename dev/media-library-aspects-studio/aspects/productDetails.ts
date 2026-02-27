import {defineAssetAspect, defineField} from 'sanity'

export default defineAssetAspect({
  name: 'productDetails',
  title: 'Product Details',
  type: 'object',
  fields: [
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
    }),
    defineField({
      name: 'inventory',
      title: 'Inventory',
      type: 'number',
    }),
  ],
})
