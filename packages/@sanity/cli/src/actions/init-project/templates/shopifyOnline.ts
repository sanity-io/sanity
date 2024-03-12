import {type ProjectTemplate} from '../initProject'

const configTemplate = `
import {shopifyAssets} from 'sanity-plugin-shopify-assets'
import {defineConfig, isDev} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {shopifyDocumentActions} from './plugins/shopifyDocumentActions'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'
import {SHOPIFY_STORE_ID} from './constants'

const devOnlyPlugins = [visionTool()]

export default defineConfig({
  name: '%sourceName%',
  title: '%projectName%',

  projectId: '%projectId%',
  dataset: '%dataset%',

  plugins: [
    structureTool({structure}),
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
    '@sanity/icons': '^2.11.0',
    '@sanity/ui': '^2.0.0',
    '@types/lodash.get': '^4.4.7',
    'lodash.get': '^4.4.2',
    'pluralize-esm': '^9.0.4',
    'sanity-plugin-shopify-assets': '^1.1.0',
  },
}
export default shopifyTemplate
