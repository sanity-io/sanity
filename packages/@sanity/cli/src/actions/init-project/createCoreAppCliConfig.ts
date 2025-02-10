import {processTemplate} from './processTemplate'

const defaultCoreAppTemplate = `
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  __experimental_coreAppConfiguration: {
    organizationId: '%organizationId%',
    appLocation: '%appLocation%',
  },
})
`

export interface GenerateCliConfigOptions {
  organizationId?: string
  appLocation: string
}

export function createCoreAppCliConfig(options: GenerateCliConfigOptions): string {
  return processTemplate({
    template: defaultCoreAppTemplate,
    variables: options,
  })
}
