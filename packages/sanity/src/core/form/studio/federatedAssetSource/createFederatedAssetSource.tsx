import {PlugIcon} from '@sanity/icons/Plug'
import {
  type Asset,
  type AssetSource,
  type AssetSourceComponentProps,
  type AssetSourceOpenInSourceResult,
} from '@sanity/types'

import {FederatedAssetSourceDialog} from './FederatedAssetSourceDialog'
import {type FederatedAssetSourceView} from './types'
import {PickerModeUploader} from './uploader'

/**
 * A Studio asset source for a third-party brokered `asset_source` view (an
 * organization's own application published through the workbench). The Media
 * Library's own view is not surfaced this way — it replaces the select dialog
 * of the built-in Media Library source instead (see `prepareConfig`).
 *
 * The name is qualified by application id so multiple applications (or
 * multiple views of one application) cannot collide; the title comes from the
 * deployment record, so there is no i18n key to offer.
 *
 * "Open in source": the source claims an asset when the asset's
 * `source.name` matches the view's application name — the convention a view
 * follows by stamping `assetDocumentProps.source.name` with its application
 * name on insert — or the qualified `{applicationId}:{viewName}` source name
 * (for applications with several views that need to disambiguate). How a
 * claimed asset opens is decided per asset by what the view stamped: with a
 * `source.url` the Studio opens that URL directly (the external service's
 * own page for the asset, e.g. Dropbox); without one the view is remounted
 * with `action: 'openInSource'` and `assetToOpen`.
 *
 * Uploads: brokered sources advertise picker-mode upload support so files
 * dragged onto (or picked from) a Studio field can be routed to them. The
 * host queues the files on a {@link PickerModeUploader} and mounts the view
 * hidden with `action: 'upload'` — the view owns the transport and the
 * `onSelect`-before-terminal-status ordering (see the contract notes on the
 * view props type). The view declarations carry no upload-capability flag
 * (yet), so a view that cannot receive uploads must immediately fail the
 * queued files with an explanatory error.
 *
 * @internal
 */
export function createFederatedAssetSource(view: FederatedAssetSourceView): AssetSource {
  const qualifiedName = `${view.applicationId}:${view.name}`

  function openInSource(asset: Asset): AssetSourceOpenInSourceResult {
    const assetSourceName = asset.source?.name
    if (assetSourceName === view.applicationName || assetSourceName === qualifiedName) {
      if (asset.source?.url) {
        return {type: 'url', url: asset.source.url}
      }
      return {type: 'component'}
    }
    return false
  }

  return {
    name: qualifiedName,
    // oxlint-disable-next-line no-deprecated -- runtime string from the deployment record; no i18n key exists
    title: view.title,
    icon: PlugIcon,
    component: (sourceProps: AssetSourceComponentProps) => (
      <FederatedAssetSourceDialog sourceProps={sourceProps} view={view} />
    ),
    Uploader: PickerModeUploader,
    openInSource,
  }
}
