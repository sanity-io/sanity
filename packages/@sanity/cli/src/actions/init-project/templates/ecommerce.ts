import type {ProjectTemplate} from '../initProject'

const configTemplate = `
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {barcodeInput} from './plugins/barcode
import {schemaTypes} from './schemas'

export default defineConfig({
  name: '%sourceName%',
  title: '%projectName%',

  projectId: '%projectId%',
  dataset: '%dataset%',

  plugins: [
    deskTool(),
    barcodeInput(),
  ],

  schema: {
    types: schemaTypes,
  },
})
`

const ecommerceTemplate: ProjectTemplate = {
  configTemplate,
  importPrompt: 'Upload a sampling of products to go with your e-commerce schema?',
  datasetUrl: 'https://public.sanity.io/ecommerce-2018-05-02.tar.gz',
  dependencies: {
    'react-barcode': '^1.3.2',
  },
}

export default ecommerceTemplate
