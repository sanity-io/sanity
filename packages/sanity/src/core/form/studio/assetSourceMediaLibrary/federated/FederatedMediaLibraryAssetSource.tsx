import {type AssetSourceComponentProps} from '@sanity/types'
import {type ReactNode, type RefAttributes, useState} from 'react'

import {useClient} from '../../../../hooks/useClient'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {DEFAULT_API_VERSION} from '../constants'
import {MediaLibraryAssetSource} from '../shared/MediaLibraryAssetSource'
import {MediaLibraryProvider} from '../shared/MediaLibraryProvider'
import {FederatedSelectAssetsDialog} from './FederatedSelectAssetsDialog'
import {type FederatedAssetSourceView} from './types'

/**
 * The built-in Media Library asset source with a federated select flow: the
 * select dialog mounts the Media Library's brokered `asset_source` view, while
 * every other action (upload, open-in-source) keeps the iframe machinery in
 * `MediaLibraryAssetSource` until the view reaches parity. When loading or
 * mounting the view fails, the select flow also falls back to the iframe
 * dialog — never a dead field.
 *
 * @internal
 */
export function FederatedMediaLibraryAssetSource(
  props: AssetSourceComponentProps & {
    libraryId: string | null
    view: FederatedAssetSourceView
  } & RefAttributes<HTMLDivElement>,
): ReactNode {
  const {libraryId, view, ...sourceProps} = props
  const {t} = useTranslation()
  const client = useClient({apiVersion: DEFAULT_API_VERSION})
  const projectId = client.config().projectId
  const [unavailable, setUnavailable] = useState(false)

  // The React Compiler memoizes this; identity is stable across renders.
  const handleUnavailable = () => setUnavailable(true)

  const {
    action = 'select',
    assetType = 'image',
    dialogHeaderTitle,
    onClose,
    onSelect,
    ref,
    schemaType,
  } = sourceProps

  if (action !== 'select' || unavailable) {
    return <MediaLibraryAssetSource {...sourceProps} libraryId={libraryId} />
  }

  if (!projectId) {
    throw new Error('No projectId found')
  }

  // Mirrors the header and asset-type mapping of the iframe select dialog.
  const selectAssetType = assetType === 'sanity.video' ? 'video' : assetType
  const selectDialogHeaderTitle =
    dialogHeaderTitle ||
    t('asset-sources.media-library.select-dialog.title', {
      context: selectAssetType,
      targetTitle: schemaType?.title,
    })

  return (
    <MediaLibraryProvider projectId={projectId} libraryId={libraryId}>
      <FederatedSelectAssetsDialog
        dialogHeaderTitle={selectDialogHeaderTitle}
        onClose={onClose}
        onSelect={onSelect}
        onUnavailable={handleUnavailable}
        ref={ref}
        schemaType={schemaType}
        sourceProps={sourceProps}
        view={view}
      />
    </MediaLibraryProvider>
  )
}
