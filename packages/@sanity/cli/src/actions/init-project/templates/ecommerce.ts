import type {ProjectTemplate} from '../initProject'

const configTemplate = `
import {createConfig, deskTool} from 'sanity'
import {barcode} from './plugins/barcode
import schemaTypes from './schemas'

export default createConfig({
  name: '%sourceName%',

  projectId: '%projectId%',
  dataset: '%dataset%',

  plugins: [
    deskTool(),
    barcode()
  ],

  schema: {
    types: schemaTypes
  }
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
