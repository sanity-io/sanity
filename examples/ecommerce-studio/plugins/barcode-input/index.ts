import {createPlugin} from 'sanity'
import {barcodeSchemaType} from './schemaType'

export const barcodeInput = createPlugin({
  name: 'barcode-input',
  schema: {
    types: [barcodeSchemaType],
  },
})
