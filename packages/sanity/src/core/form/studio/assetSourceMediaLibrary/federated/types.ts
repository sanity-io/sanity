import {type PluginFilter} from '@sanity/media-library-types'
import {type FederationRemote} from '@sanity/sdk-react/dashboard'
import {type AssetSourceComponentProps} from '@sanity/types'

import {type AssetSelectionItem} from '../types'

/**
 * The props the host passes to a mounted federated view: Studio's asset-source
 * component props plus the host-provided extras the iframe used to receive as
 * payload params. Selection flows back through `onSelectionChange` (the
 * federated equivalent of the iframe's `assetSelection` postMessage stream);
 * the host owns the footer, validation and the final link + `onSelect`.
 *
 * @internal
 */
export interface FederatedAssetSourceViewProps extends AssetSourceComponentProps {
  /** The Media Library the picker should browse. */
  libraryId?: string | null
  /** Streams the current in-picker selection to the host on every change. */
  onSelectionChange?: (selection: AssetSelectionItem[]) => void
  /** Read-only GROQ filters from the schema (`options.mediaLibrary.filters`). */
  pluginFilters?: PluginFilter[]
  /** The Studio's resolved color scheme, so the view matches the host theme. */
  scheme?: 'light' | 'dark'
  /**
   * Reports the uploaded assets once an `upload` mount's batch settles; the
   * host links them and closes the flow. Uploads are driven directly through
   * the inherited `uploader` prop — the view reads the pending files with
   * `uploader.getFiles()` and writes progress/terminal statuses back with
   * `uploader.updateFile()`, per the `AssetSourceUploader` picker-mode
   * contract. No postMessage protocol: that exists only for the iframe
   * integration, where the uploader object is unreachable across the window
   * boundary.
   */
  onUploadComplete?: (assets: AssetSelectionItem[]) => void
  /**
   * Opaque key partitioning picker-location persistence per hosting
   * workspace, same as the iframe payload's `pickerPersistenceKey`.
   */
  pickerPersistenceKey?: string
}

/**
 * The view contract version this Studio supports. The federated view artifact
 * exports its own `version`; a mismatch means the render contract may have
 * changed shape, so the host falls back to the iframe dialog instead of
 * mounting it.
 *
 * Keep in sync with `VIEW_CONTRACT_VERSION` in `@sanity/workbench-cli`.
 *
 * @internal
 */
export const SUPPORTED_VIEW_CONTRACT_VERSION = 1

/**
 * The handle returned by a federated view's `render()`.
 *
 * @internal
 */
export interface FederatedAssetSourceViewHandle {
  dispose: () => void
  setLifecycle?: (state: 'foreground' | 'background') => void
}

/**
 * The module shape of a federated `asset_source` view expose, as built by
 * `@sanity/workbench-cli` from `unstable_defineView('asset_source', …)`. The
 * artifact bundles all of its dependencies (empty federation share scope) and
 * owns a private React root under `rootElement`; calling `render()` again
 * with the same root element updates the mounted view's props in place.
 *
 * @internal
 */
export interface FederatedAssetSourceModule {
  render: (
    rootElement: HTMLElement,
    props: FederatedAssetSourceViewProps,
    renderOptions?: {reactStrictMode?: boolean},
  ) => FederatedAssetSourceViewHandle
  version: number
}

/**
 * A brokered federated asset-source view: where to register the remote and
 * which expose to load from it.
 *
 * @internal
 */
export interface FederatedAssetSourceRef {
  remote: FederationRemote
  moduleId: string
}

/**
 * A brokered `asset_source` view discovered on the workbench message bus,
 * carrying the publishing application's identity so a Studio asset source can
 * be named and titled from it.
 *
 * @internal
 */
export interface FederatedAssetSourceView extends FederatedAssetSourceRef {
  /** The publishing application's id — also the federation remote name. */
  applicationId: string
  /** Stable, immutable application identity (`ApplicationBase.name`). */
  applicationName: string
  /** Human-readable application title. */
  applicationTitle: string
  /** The view's name, unique within its application. */
  name: string
  /** Human-readable view title. */
  title: string
}
