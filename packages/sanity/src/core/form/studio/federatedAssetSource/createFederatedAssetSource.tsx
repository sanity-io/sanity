import {PlugIcon} from '@sanity/icons/Plug'
import {type AssetSource, type AssetSourceComponentProps} from '@sanity/types'

import {FederatedAssetSourceDialog} from './FederatedAssetSourceDialog'
import {type FederatedAssetSourceView} from './types'

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
 * @internal
 */
export function createFederatedAssetSource(view: FederatedAssetSourceView): AssetSource {
  return {
    name: `${view.applicationId}:${view.name}`,
    // oxlint-disable-next-line no-deprecated -- runtime string from the deployment record; no i18n key exists
    title: view.title,
    icon: PlugIcon,
    component: (sourceProps: AssetSourceComponentProps) => (
      <FederatedAssetSourceDialog sourceProps={sourceProps} view={view} />
    ),
  }
}
