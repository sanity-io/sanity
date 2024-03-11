import {type ProjectTemplate} from '../initProject'

const configTemplate = `
import {defineConfig, isDev} from 'sanity'
import {visionTool} from '@sanity/vision'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'
import {getStartedPlugin} from './plugins/sanity-plugin-tutorial'

const devOnlyPlugins = [getStartedPlugin()]

export default defineConfig({
  name: '%sourceName%',
  title: '%projectName%',

  projectId: '%projectId%',
  dataset: '%dataset%',

  plugins: [structureTool(), visionTool(), ...(isDev ? devOnlyPlugins : [])],

  schema: {
    types: schemaTypes,
  },
})

`

const getStartedTemplate: ProjectTemplate = {
  configTemplate,
  typescriptOnly: true,
  dependencies: {
    '@sanity/icons': '^2.11.0',
    '@sanity/ui': '^2.0.0',
  },
}

export default getStartedTemplate
