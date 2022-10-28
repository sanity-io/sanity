import type {ProjectTemplate} from '../initProject'

// @todo asset sources
// @todo new document structure
// @todo document actions
const configTemplate = `
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {dashboard} from '@sanity/dashboard'
import {media} from 'sanity-plugin-media'
import {structure} from './deskStructure'
import {schemaTypes} from './schemas'

export default defineConfig({
  plugins: [
    deskTool({structure}),
    media(),
    dashboard({
      widgets: [shopifyWidget()]
    }),
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

const shopifyTemplate: ProjectTemplate = {
  configTemplate,
  importPrompt: 'Add a sampling of sci-fi movies to your dataset on the hosted backend?',
  datasetUrl: 'https://public.sanity.io/moviesdb-2018-03-06.tar.gz',
  dependencies: {
    '@sanity/dashboard': '^2.21.7',
    'lodash.get': '^4.4.2',
    'pluralize-esm': '^9.0.2',
    'react-time-ago': '7.1.3',
    slug: '^5.1.0',
    'sanity-plugin-dashboard-widget-shopify': '^0.1.7',
    'sanity-plugin-media': '^1.4.3',
  },
}
export default shopifyTemplate
