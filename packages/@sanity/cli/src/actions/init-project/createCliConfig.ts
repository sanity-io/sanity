import {processTemplate} from './processTemplate'

const defaultTemplate = `
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '%projectId%',
    dataset: '%dataset%'
  },
  /**
   * Enable auto-updates for studios.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  autoUpdates: __BOOL__autoUpdates__,
})
`

export interface GenerateCliConfigOptions {
  projectId: string
  dataset: string
  autoUpdates: boolean
}

export function createCliConfig(options: GenerateCliConfigOptions): string {
  return processTemplate({
    template: defaultTemplate,
    variables: options,
    includeBooleanTransform: true,
  })
}
