import {defineTrace} from '@sanity/telemetry'

interface CLITraceData {
  /**
   * Command flags, without the core options (help, debug, version etc)
   */
  groupOrCommand: string

  /**
   * Command arguments, eg any arguments after `sanity <command>` (no flags)
   */
  commandArguments: string[]

  /**
   * Arguments after the ended argument list (--)
   */
  extraArguments: string[]
  coreOptions: {
    help?: boolean
    debug?: boolean
    version?: boolean
  }
}

export const CliCommand = defineTrace<CLITraceData>({
  name: 'CLI Command Executed',
  version: 1,
  description: 'A CLI command was executed',
})
