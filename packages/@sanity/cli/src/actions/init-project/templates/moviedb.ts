import {type ProjectTemplate} from '../initProject'

const configTemplate = `
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: '%sourceName%',
  title: '%projectName%',

  projectId: '%projectId%',
  dataset: '%dataset%',

  plugins: [
    structureTool(),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
`

const movieTemplate: ProjectTemplate = {
  configTemplate,
  importPrompt: 'Add a sampling of sci-fi movies to your dataset on the hosted backend?',
  datasetUrl: 'https://public.sanity.io/moviesdb-2018-03-06.tar.gz',
  dependencies: {
    'react-icons': '^3.11.0',
  },
}
export default movieTemplate
