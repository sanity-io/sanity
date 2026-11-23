import {defineEvent} from '@sanity/telemetry'
import {type AssetSourceComponentAction} from '@sanity/types'

/**
 * How the Media Library asset source rendered:
 * - `federated`: the Media Library's brokered view mounted.
 * - `iframe_fallback`: the federated view was wanted but the iframe was used,
 *   see the `reason`.
 * - `iframe_opt_out`: `mediaLibrary.__internal.federatedAssetSource` is `false`.
 * - `iframe_unsupported`: the Studio does not run inside the workbench, so
 *   there is no federated view to use.
 *
 * @internal
 */
export type MediaLibraryAssetSourceOutcome =
  | 'federated'
  | 'iframe_fallback'
  | 'iframe_opt_out'
  | 'iframe_unsupported'

/**
 * Why the iframe was used:
 * - `cold_start`: the workbench had not published its application list when
 *   the Studio resolved its asset sources.
 * - `applications_list_failed`: the workbench published an error for the list.
 * - `no_view`: the list has no loadable Media Library `asset_source` view.
 * - `load_failed`: the view module failed to load, or threw when mounted.
 * - `standalone_studio`: the Studio does not run inside the workbench.
 *
 * @internal
 */
export type MediaLibraryAssetSourceReason =
  | 'cold_start'
  | 'applications_list_failed'
  | 'no_view'
  | 'load_failed'
  | 'standalone_studio'

/**
 * An outcome decided when the Studio resolved its asset sources, before any
 * picker opened. Carried by the iframe source so it can report it on open.
 *
 * @internal
 */
export interface MediaLibraryAssetSourceIframeResolution {
  outcome: Exclude<MediaLibraryAssetSourceOutcome, 'federated'>
  reason: MediaLibraryAssetSourceReason | null
}

/** @internal */
export interface MediaLibraryAssetSourceResolvedInfo {
  outcome: MediaLibraryAssetSourceOutcome
  /** Set for `iframe_fallback` and `iframe_unsupported`, otherwise `null`. */
  reason: MediaLibraryAssetSourceReason | null
  /** The asset source action the source opened with. */
  action: AssetSourceComponentAction
  /**
   * Milliseconds from opening the source until the federated view mounted or
   * failed. `null` when the outcome was decided before the source opened.
   */
  durationMs: number | null
}

/** @internal */
export const MediaLibraryAssetSourceResolved = defineEvent<MediaLibraryAssetSourceResolvedInfo>({
  name: 'Media Library Asset Source Resolved',
  version: 1,
  description:
    'The Media Library asset source opened (select, upload or open in source) and rendered either ' +
    'the federated view or the iframe. Sent once per open, with the reason for an iframe fallback.',
})
