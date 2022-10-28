import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {schemaTypes} from '../../packages/@sanity/cli/templates/ecommerce/schemas'
import {barcodeInput} from './plugins/barcode-input'

export default defineConfig({
  name: 'default',
  title: 'Sanity E-commerce example studio',

  projectId: 'ru2xdibx',
  dataset: 'production',

  schema: {
    types: schemaTypes,
  },

  plugins: [deskTool(), barcodeInput()],
})
