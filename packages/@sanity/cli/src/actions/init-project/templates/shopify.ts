import {type ProjectTemplate} from '../initProject'

const configTemplate = `
import {defineConfig, isDev} from 'sanity'

import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

import {visionTool} from '@sanity/vision'
import {colorInput} from '@sanity/color-input'
import {imageHotspotArrayPlugin} from 'sanity-plugin-hotspot-array'
import {media, mediaAssetSource} from 'sanity-plugin-media'
import {customDocumentActions} from './plugins/customDocumentActions'
import Navbar from './components/studio/Navbar'

const devOnlyPlugins = [visionTool()]

export default defineConfig({
  name: '%sourceName%',
  title: '%projectName%',

  projectId: '%projectId%',
  dataset: '%dataset%',

  plugins: [
    structureTool({structure}),
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
      assetSources: (previousAssetSources) => {
        return previousAssetSources.filter((assetSource) => assetSource !== mediaAssetSource)
      },
    },
    image: {
      assetSources: (previousAssetSources) => {
        return previousAssetSources.filter((assetSource) => assetSource === mediaAssetSource)
      },
    },
  },

  studio: {
    components: {
      navbar: Navbar,
    },
  },
})`

const shopifyTemplate: ProjectTemplate = {
  configTemplate,
  dependencies: {
    '@sanity/asset-utils': '^1.3.0',
    '@sanity/color-input': '^3.0.2',
    '@sanity/icons': '^2.11.0',
    '@sanity/ui': '^2.0.0',
    'lodash.get': '^4.4.2',
    'pluralize-esm': '^9.0.2',
    'sanity-plugin-hotspot-array': '^1.0.1',
    'sanity-plugin-media': '^2.0.5',
    'slug': '^8.2.2',
  },
  devDependencies: {
    '@portabletext/types': '^2.0.2',
    '@types/lodash.get': '^4.4.7',
    '@types/slug': '^5.0.3',
  },
}
export default shopifyTemplate
