import {schemaTypes} from '../../packages/@sanity/cli/templates/ecommerce/schemaTypes'
import {barcodeInput} from './plugins/barcode-input'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

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
