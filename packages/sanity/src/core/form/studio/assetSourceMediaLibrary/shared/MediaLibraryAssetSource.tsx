import {type AssetSourceComponentProps} from '@sanity/types'
import {PortalProvider} from '@sanity/ui'
import {type ForwardedRef, forwardRef, memo, useCallback, useEffect, useState} from 'react'

import {useClient} from '../../../../hooks'
import {useTranslation} from '../../../../i18n'
import {DEFAULT_API_VERSION} from '../constants'
import {MediaLibraryProvider} from './MediaLibraryProvider'
import {OpenInSourceDialog} from './OpenInSourceDialog'
import {SelectAssetsDialog} from './SelectAssetsDialog'
import {UploadAssetsDialog} from './UploadAssetDialog'

const MediaLibraryAssetSourceComponent = function MediaLibraryAssetSourceComponent(
  props: AssetSourceComponentProps & {libraryId: string | null},
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    accept,
    action = 'select',
    assetSource,
    assetToOpen,
    assetType = 'image',
    dialogHeaderTitle,
    libraryId: libraryIdProp,
    onChangeAction,
    onClose,
    onSelect,
    selectedAssets: _selectedAssets, // TODO: allow for pre-selected assets?
    schemaType,
    uploader,
  } = props

  const {t} = useTranslation()
  const client = useClient({apiVersion: DEFAULT_API_VERSION})
  const projectId = client.config().projectId
  const portalElement = useRootPortalElement()
  const handleSelectNewAsset = useCallback(() => {
    if (onChangeAction) {
      onChangeAction('select')
    }
  }, [onChangeAction])

  if (!projectId) {
    throw new Error('No projectId found')
  }

  const selectAssetType = assetType === 'sanity.video' ? 'video' : assetType

  return (
    <MediaLibraryProvider projectId={projectId} libraryId={libraryIdProp}>
      <PortalProvider element={portalElement}>
        {action === 'upload' && (
          <UploadAssetsDialog
            accept={accept}
            assetSource={assetSource}
            onClose={onClose}
            onSelect={onSelect}
            schemaType={schemaType}
            selectAssetType={selectAssetType}
            uploader={uploader}
          />
        )}
        {action === 'select' && (
          <SelectAssetsDialog
            dialogHeaderTitle={dialogHeaderTitle}
            ref={ref}
            onClose={onClose}
            onSelect={onSelect}
            selection={[]}
            schemaType={schemaType}
            selectAssetType={selectAssetType}
          />
        )}
        {action === 'openInSource' && assetToOpen && (
          <OpenInSourceDialog
            asset={assetToOpen}
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
          />
        )}
      </PortalProvider>
    </MediaLibraryProvider>
  )
}

export const MediaLibraryAssetSource = memo(forwardRef(MediaLibraryAssetSourceComponent))

const useRootPortalElement = () => {
  const [container] = useState(() => document.createElement('div'))

  useEffect(() => {
    container.classList.add('media-library-portal')
    document.body.appendChild(container)
    return () => {
      document.body.removeChild(container)
    }
  }, [container])

  return container
}
