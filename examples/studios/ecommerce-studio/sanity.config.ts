import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {barcodeInput} from './plugins/barcode-input'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Sanity E-commerce example studio',

  projectId: 'ru2xdibx',
  dataset: 'production',

  schema: {
    types: schemaTypes,
  },

  plugins: [structureTool(), barcodeInput()],
})
