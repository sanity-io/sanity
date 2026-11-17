import {type CliConfig} from '@sanity/cli'

export type {CliClientOptions, CliConfig} from '@sanity/cli'

export {
  // oxlint-disable-next-line no-deprecated -- deprecated alias of defineCliConfig; removal is a follow-up
  createCliConfig,
  type DefineAppInput,
  defineApplication,
  defineAssetSourceView,
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

/**
 * CLI config for a Studio or app.
 *
 * Studio v7 does not load a project-root `_document` component unless
 * `unstable_documentComponent` is `true`. Customize the HTML document through
 * the `vite` option.
 *
 * @beta
 */
export function defineCliConfig(config: CliConfig): CliConfig {
  return {unstable_documentComponent: false, ...config}
}
