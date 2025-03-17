import {processTemplate} from './processTemplate'

const defaultAppTemplate = `
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  __experimental_appConfiguration: {
    organizationId: '%organizationId%',
    appLocation: '%appLocation%',
  },
})
`

export interface GenerateCliConfigOptions {
  organizationId?: string
  appLocation: string
}

export function createAppCliConfig(options: GenerateCliConfigOptions): string {
  return processTemplate({
    template: defaultAppTemplate,
    variables: options,
  })
}
