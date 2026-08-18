export type {CliClientOptions, CliConfig} from '@sanity/cli'
export {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  createCliConfig,
  type DefineAppInput,
  defineCliConfig,
  type DefineMediaLibraryInput,
  getCliClient,
  type MediaLibraryField,
  unstable_defineApp,
  unstable_defineMediaLibrary,
} from '@sanity/cli'
export {getStudioEnvironmentVariables, type StudioEnvVariablesOptions} from '@sanity/cli/_internal'
