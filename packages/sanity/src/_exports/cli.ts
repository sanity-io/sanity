import {type SchemaValidationProblemGroup} from '@sanity/types'
import {firstValueFrom, type ObservedValueOf} from 'rxjs'

import {
  type createDefaultIcon,
  type createSchema,
  type generateStudioManifest,
  type resolveConfig,
  type StudioManifest,
} from './_dangerously_use_private_internals_that_do_not_follow_semver'

export type {CliClientOptions, CliConfig} from '@sanity/cli'
export {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  createCliConfig,
  type DefineAppInput,
  defineApplication,
  defineAssetSourceView,
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

/**
 * The operations the CLI needs from the Studio to resolve workspaces, compile schemas and
 * generate manifests. The CLI gets them from {@link getStudioCliTooling}, so it does not depend
 * on where the underlying functions are exported from inside `sanity`.
 *
 * @beta
 */
export interface StudioCliTooling {
  /** Compiles a schema definition. */
  compileSchema: (definition: Parameters<typeof createSchema>[0]) => ReturnType<typeof createSchema>

  /** Creates the icon used for a workspace or tool that does not define one. */
  createDefaultIcon: (title: string, subtitle: string) => ReturnType<typeof createDefaultIcon>

  /** Generates the studio manifest for resolved workspaces. */
  generateStudioManifest: (
    options: Parameters<typeof generateStudioManifest>[0],
  ) => Promise<StudioManifest>

  /**
   * Returns the validation problem groups carried by a schema error thrown while resolving or
   * compiling a schema, or `undefined` if `error` is not a schema error.
   */
  getSchemaValidation: (error: unknown) => SchemaValidationProblemGroup[] | undefined

  /** Resolves workspace configs into workspaces. */
  resolveWorkspaces: (
    workspaces: Parameters<typeof resolveConfig>[0],
  ) => Promise<ObservedValueOf<ReturnType<typeof resolveConfig>>>
}

/**
 * Returns the {@link StudioCliTooling} the CLI uses to work with this Studio. The internals entry
 * is imported when this is called, so loading `sanity/cli` from `sanity.cli.ts` stays light.
 *
 * @beta
 */
export async function getStudioCliTooling(): Promise<StudioCliTooling> {
  const internals = await import('./_dangerously_use_private_internals_that_do_not_follow_semver')

  return {
    compileSchema: (definition) => internals.createSchema(definition),
    createDefaultIcon: (title, subtitle) => internals.createDefaultIcon(title, subtitle),
    generateStudioManifest: (options) => internals.generateStudioManifest(options),
    getSchemaValidation: (error) =>
      error instanceof internals.SchemaError ? error.schema._validation : undefined,
    resolveWorkspaces: (workspaces) => firstValueFrom(internals.resolveConfig(workspaces)),
  }
}
