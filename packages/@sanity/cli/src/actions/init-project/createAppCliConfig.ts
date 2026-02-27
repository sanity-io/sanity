import {processTemplate} from './processTemplate'

const defaultAppTemplate = `
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  app: {
    organizationId: '%organizationId%',
    entry: '%entry%',
  },
})
`

export interface GenerateCliConfigOptions {
  organizationId?: string
  entry: string
}

export function createAppCliConfig(options: GenerateCliConfigOptions): string {
  return processTemplate({
    template: defaultAppTemplate,
    variables: options,
  })
}
