import {definePlugin} from 'sanity'
import {barcodeSchemaType} from './schemaType'

export const barcodeInput = definePlugin({
  name: 'barcode-input',
  schema: {
    types: [barcodeSchemaType],
  },
})
