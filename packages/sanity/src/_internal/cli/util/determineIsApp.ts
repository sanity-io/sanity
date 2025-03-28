import {type CliConfig} from '@sanity/cli'

export function determineIsApp(cliConfig?: CliConfig): boolean {
  return Boolean(cliConfig && 'app' in cliConfig)
}
