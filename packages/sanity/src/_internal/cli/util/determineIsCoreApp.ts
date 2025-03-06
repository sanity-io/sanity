import {type CliConfig} from '@sanity/cli'

export function determineIsCoreApp(cliConfig?: CliConfig): boolean {
  return Boolean(cliConfig && '__experimental_coreAppConfiguration' in cliConfig)
}
