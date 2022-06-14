import type {ProjectTemplate} from '../initProject'

const configTemplate = `
import {createConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {tutorialLayout} from './plugins/tutorial'
import {schemaTypes} from './schemas'

export default createConfig({
  plugins: [
    deskTool(),
    tutorialLayout()
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

const getStartedTemplate: ProjectTemplate = {
  configTemplate,
}

export default getStartedTemplate
