import type {ProjectTemplate} from '../initProject'

const configTemplate = `
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {tutorialLayout} from './plugins/tutorial'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: '%sourceName%',
  title: '%projectName%',

  projectId: '%projectId%',
  dataset: '%dataset%',

  plugins: [
    deskTool(),
    tutorialLayout(),
  ],

  schema: {
    types: schemaTypes,
  },
})
`

const getStartedTemplate: ProjectTemplate = {
  configTemplate,
}

export default getStartedTemplate
