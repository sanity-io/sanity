export type {CliClientOptions, CliConfig} from '@sanity/cli'
export {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  createCliConfig,
  type DefineAppInput,
  defineApplication,
  defineCliConfig,
  type DefineMediaLibraryInput,
  definePanelView,
  defineTileView,
  defineWebWorker,
  defineWindowView,
  getCliClient,
  type MediaLibraryField,
  unstable_defineMediaLibrary,
} from '@sanity/cli'
export {getStudioEnvironmentVariables, type StudioEnvVariablesOptions} from '@sanity/cli/_internal'
