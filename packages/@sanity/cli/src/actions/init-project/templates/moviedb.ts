import type {ProjectTemplate} from '../initProject'

const configTemplate = `
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
//import {googleMapsInput} from '@sanity/google-maps-input'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: '%sourceName%',
  title: '%projectName%',

  projectId: '%projectId%',
  dataset: '%dataset%',

  plugins: [
    deskTool(),
    visionTool(),
    //googleMapsInput(),
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
    //'@sanity/google-maps-input': '^2.27.0',
    'react-icons': '^3.11.0',
  },
}
export default movieTemplate
