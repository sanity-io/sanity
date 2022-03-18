import type {ProjectTemplate} from '../initProject'

const configTemplate = `
import {createConfig} from '@sanity/base'
import {deskTool} from '@sanity/desk-tool'
import {googleMapsInput} from '@sanity/google-maps-input'
import schemaTypes from './schemas'

export default createConfig({
  plugins: [
    deskTool(),
    googleMapsInput()
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

const movieTemplate: ProjectTemplate = {
  configTemplate,
  importPrompt: 'Add a sampling of sci-fi movies to your dataset on the hosted backend?',
  datasetUrl: 'https://public.sanity.io/moviesdb-2018-03-06.tar.gz',
  dependencies: {
    '@sanity/google-maps-input': '^2.27.0',
    'react-icons': '^3.11.0',
  },
}
export default movieTemplate
