import {type AssetSourceComponentProps} from '@sanity/types'
import {PortalProvider} from '@sanity/ui'
import {type ForwardedRef, forwardRef, memo, useEffect, useState} from 'react'

import {useClient} from '../../../../hooks/useClient'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {DEFAULT_API_VERSION} from '../constants'
import {MediaLibraryProvider} from './MediaLibraryProvider'
import {SelectAssetsDialog} from './SelectAssetsDialog'
import {UploadAssetsDialog} from './UploadAssetDialog'

const MediaLibraryAssetSourceComponent = function MediaLibraryAssetSourceComponent(
  props: AssetSourceComponentProps & {libraryId: string | null},
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    accept, // TODO: make the plugin respect this filter?
    action = 'select',
    assetSource,
    assetType = 'image',
    dialogHeaderTitle,
    libraryId: libraryIdProp,
    onClose,
    onSelect,
    selectedAssets, // TODO: allow for pre-selected assets?
    schemaType,
    uploader,
  } = props

  const {t} = useTranslation()
  const client = useClient({apiVersion: DEFAULT_API_VERSION})
  const projectId = client.config().projectId
  const portalElement = useRootPortalElement()

  if (!projectId) {
    throw new Error('No projectId found')
  }

  return (
    <MediaLibraryProvider projectId={projectId} libraryId={libraryIdProp}>
      <UploadAssetsDialog
        open={action === 'upload'}
        onClose={onClose}
        onSelect={onSelect}
        schemaType={schemaType}
        uploader={uploader}
      />
      <PortalProvider element={portalElement}>
        <SelectAssetsDialog
          dialogHeaderTitle={
            dialogHeaderTitle ||
            t('asset-sources.media-library.select-dialog.title', {
              assetType: assetType,
              targetTitle: schemaType?.title,
            })
          }
          open={action === 'select'}
          ref={ref}
          onClose={onClose}
          onSelect={onSelect}
          selection={[]}
          schemaType={schemaType}
          selectAssetType={assetType}
        />
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
