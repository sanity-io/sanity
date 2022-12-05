import type {ProjectTemplate} from '../initProject'

const configTemplate = `
import {AssetSource, defineConfig, isDev} from 'sanity'

import {deskTool} from 'sanity/desk'
import {schemaTypes} from './schemas'
import {structure} from './desk'

import {visionTool} from '@sanity/vision'
import {colorInput} from '@sanity/color-input'
import {imageHotspotArrayPlugin} from 'sanity-plugin-hotspot-array'
import {media, mediaAssetSource} from 'sanity-plugin-media'
import {customDocumentActions} from './plugins/customDocumentActions'

const devOnlyPlugins = [visionTool()]

export default defineConfig({
  name: '%sourceName%',
  title: '%projectName%',

  projectId: '%projectId%',
  dataset: '%dataset%',

  plugins: [
    deskTool({structure}),
    colorInput(),
    imageHotspotArrayPlugin(),
    customDocumentActions(),
    media(),
    ...(isDev ? devOnlyPlugins : []),
  ],

  schema: {
    types: schemaTypes,
  },

  form: {
    file: {
      assetSources: (previousAssetSources: AssetSource[]) => {
        return previousAssetSources.filter((assetSource) => assetSource !== mediaAssetSource)
      },
    },
    image: {
      assetSources: (previousAssetSources: AssetSource[]) => {
        return previousAssetSources.filter((assetSource) => assetSource === mediaAssetSource)
      },
    },
  },
})`

const shopifyTemplate: ProjectTemplate = {
  configTemplate,
  dependencies: {
    '@sanity/asset-utils': '^1.3.0',
    '@sanity/color-input': '^3.0.1',
    'lodash.get': '^4.4.2',
    'pluralize-esm': '^9.0.2',
    'sanity-plugin-hotspot-array': '^1.0.0',
    'sanity-plugin-media': '^2.0.2',
    slug: '^8.2.2',
    '@types/lodash.get': '^4.4.7',
    '@types/slug': '^5.0.3',
  },
}
export default shopifyTemplate
