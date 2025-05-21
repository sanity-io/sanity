import {type AssetSourceComponentProps} from '@sanity/types'
import {type ForwardedRef, forwardRef, memo} from 'react'

import {useClient} from '../../../../hooks'
import {useTranslation} from '../../../../i18n'
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
  } = props

  const {t} = useTranslation()
  const client = useClient({apiVersion: DEFAULT_API_VERSION})
  const projectId = client.config().projectId

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
        uploader={assetSource.uploader}
      />

      <SelectAssetsDialog
        dialogHeaderTitle={
          dialogHeaderTitle ||
          t('asset-source.dialog.default-title', {
            context: assetType,
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
    </MediaLibraryProvider>
  )
}

export const MediaLibraryAssetSource = memo(forwardRef(MediaLibraryAssetSourceComponent))
