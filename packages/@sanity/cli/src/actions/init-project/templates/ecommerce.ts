import type {ProjectTemplate} from '../initProject'

const configTemplate = `
import {createConfig} from '@sanity/base'
import {deskTool} from '@sanity/desk-tool'
import {barcode} from './plugins/barcode
import schemaTypes from './schemas'

export default createConfig({
  plugins: [
    deskTool(),
    barcode()
  ],
  project: {
    name: '%projectName%'
  },
  sources: [
    {
      name: '%sourceName%',
      title: '%sourceTitle%',
      projectId: '%projectId%',
      dataset: '%dataset%',
      schemaTypes
    },
  ],
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
