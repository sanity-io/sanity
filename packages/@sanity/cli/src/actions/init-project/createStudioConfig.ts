import {processTemplate} from './processTemplate'

const defaultTemplate = `
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: '%sourceName%',
  title: '%projectName%',

  projectId: '%projectId%',
  dataset: '%dataset%',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },

  mediaLibrary: {
    enabled: true
  },

  form: {
    image: {
      assetSources: (sources) => sources.filter((source) => source.name !== 'sanity-default')
    },
    file: {
      assetSources: (sources) => sources.filter((source) => source.name !== 'sanity-default')
    }
  },
})
`

const defaultVariables = {
  projectName: 'Sanity Studio',
  sourceName: 'default',
  sourceTitle: 'Default',
}

export interface GenerateConfigOptions {
  template?: string | ((variables: GenerateConfigOptions['variables']) => string)
  variables: {
    projectId: string
    dataset: string
    autoUpdates: boolean
    projectName?: string
    sourceName?: string
    sourceTitle?: string
    organizationId?: string
  }
}

export function createStudioConfig(options: GenerateConfigOptions): string {
  const variables = {...defaultVariables, ...options.variables}
  if (typeof options.template === 'function') {
    return options.template(variables).trimStart()
  }

  return processTemplate({
    template: options.template || defaultTemplate,
    variables,
  })
}
