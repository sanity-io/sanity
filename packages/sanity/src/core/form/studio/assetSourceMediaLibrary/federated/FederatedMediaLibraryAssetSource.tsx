import {type AssetSourceComponentProps} from '@sanity/types'
import {PortalProvider} from '@sanity/ui'
import {type ReactNode, type RefAttributes, useState} from 'react'
import {encodeJsonParams} from 'sanity/router'

import {useClient} from '../../../../hooks/useClient'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../../../studio/workspace'
import {DEFAULT_API_VERSION} from '../constants'
import {MediaLibraryAssetSource, useRootPortalElement} from '../shared/MediaLibraryAssetSource'
import {MediaLibraryProvider} from '../shared/MediaLibraryProvider'
import {FederatedOpenInSourceDialog} from './FederatedOpenInSourceDialog'
import {FederatedSelectAssetsDialog} from './FederatedSelectAssetsDialog'
import {FederatedUploadDialog} from './FederatedUploadDialog'
import {type FederatedAssetSourceView, type FederatedAssetSourceViewProps} from './types'

/**
 * The built-in Media Library asset source, fully federated: every action —
 * select, upload, open-in-source — mounts the Media Library's brokered
 * `asset_source` view instead of the iframe machinery. When loading or
 * mounting the view fails, the source falls back to the iframe
 * `MediaLibraryAssetSource` for all actions — never a dead field.
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
  const workspace = useWorkspace()
  const [unavailable, setUnavailable] = useState(false)
  // Body-level portal target so the dialogs escape the document pane's portal
  // and fill the whole studio surface, exactly like the iframe asset source.
  const portalElement = useRootPortalElement()

  // The React Compiler memoizes these; identities are stable across renders.
  const handleUnavailable = () => setUnavailable(true)
  const handleSelectNewAsset = () => sourceProps.onChangeAction?.('select')

  const {
    action = 'select',
    assetToOpen,
    assetType = 'image',
    dialogHeaderTitle,
    onClose,
    onSelect,
    ref,
    schemaType,
  } = sourceProps

  if (unavailable) {
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

  // The same workspace-scoped persistence partition the iframe integration
  // computes, so the picker remembers its location per hosting workspace.
  const pickerPersistenceKey =
    encodeJsonParams({
      projectId: workspace.projectId,
      dataset: workspace.dataset,
      workspaceName: workspace.name,
    }) || undefined

  const viewSourceProps: FederatedAssetSourceViewProps = {...sourceProps, pickerPersistenceKey}

  return (
    <MediaLibraryProvider projectId={projectId} libraryId={libraryId}>
      <FederatedUploadDialog
        open={action === 'upload'}
        onClose={onClose}
        onSelect={onSelect}
        onUnavailable={handleUnavailable}
        schemaType={schemaType}
        sourceProps={viewSourceProps}
        view={view}
      />
      <PortalProvider element={portalElement}>
        {action === 'select' && (
          <FederatedSelectAssetsDialog
            dialogHeaderTitle={selectDialogHeaderTitle}
            onClose={onClose}
            onSelect={onSelect}
            onUnavailable={handleUnavailable}
            ref={ref}
            schemaType={schemaType}
            sourceProps={viewSourceProps}
            view={view}
          />
        )}
        {action === 'openInSource' && assetToOpen && (
          <FederatedOpenInSourceDialog
            dialogHeaderTitle={t('asset-sources.media-library.open-in-source-dialog.title')}
            selectNewAssetButtonLabel={
              schemaType?.title
                ? t('asset-sources.media-library.open-in-source-dialog.button.select-new-asset', {
                    targetTitle: schemaType.title,
                  })
                : t(
                    'asset-sources.media-library.open-in-source-dialog.button.select-new-asset-fallback',
                  )
            }
            onClose={onClose}
            onSelectNewAsset={handleSelectNewAsset}
            onUnavailable={handleUnavailable}
            ref={ref}
            sourceProps={viewSourceProps}
            view={view}
          />
        )}
      </PortalProvider>
    </MediaLibraryProvider>
  )
}
