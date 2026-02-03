import {barcodeSchemaType} from './schemaType'
import {definePlugin} from 'sanity'

export const barcodeInput = definePlugin({
  name: 'barcode-input',
  schema: {
    types: [barcodeSchemaType],
  },
})
