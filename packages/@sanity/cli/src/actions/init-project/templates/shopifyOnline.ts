import type {ProjectTemplate} from '../initProject'

const configTemplate = `
import {shopifyAssets} from 'sanity-plugin-shopify-assets'
import {defineConfig, isDev} from 'sanity'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
import {shopifyDocumentActions} from './plugins/shopifyDocumentActions'
import {schemaTypes} from './schemas'
import {structure} from './desk'
import {SHOPIFY_STORE_ID} from './constants'

const devOnlyPlugins = [visionTool()]

export default defineConfig({
  name: '%sourceName%',
  title: '%projectName%',

  projectId: '%projectId%',
  dataset: '%dataset%',

  plugins: [
    deskTool({structure}),
    shopifyDocumentActions(),
    shopifyAssets({
      shopifyDomain: SHOPIFY_STORE_ID,
    }),
    ...(isDev ? devOnlyPlugins : []),
  ],

  schema: {
    types: schemaTypes,
  },
})
`

const shopifyTemplate: ProjectTemplate = {
  configTemplate,
  typescriptOnly: true,
  dependencies: {
    '@portabletext/toolkit': '^2.0.1',
    '@sanity/icons': '^2.2.2',
    '@sanity/ui': '^1.2.2',
    '@types/lodash.get': '^4.4.7',
    'lodash.get': '^4.4.2',
    'pluralize-esm': '^9.0.4',
    'sanity-plugin-shopify-assets': '^1.1.0',
  },
}
export default shopifyTemplate
