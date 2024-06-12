import {isImageSource} from '@sanity/asset-utils'
import {ImageIcon, SearchIcon} from '@sanity/icons'
import {type AssetSource, type ImageAsset, type Reference} from '@sanity/types'
import {get, startCase} from 'lodash'
import {memo, type ReactNode, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable} from 'rxjs'

import {MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {ActionsMenu} from '../common/ActionsMenu'
import {ImageActionsMenu, ImageActionsMenuWaitPlaceholder} from './ImageActionsMenu'
import {type BaseImageInputProps} from './types'

function ImageInputAssetMenuComponent(
  props: Pick<
    BaseImageInputProps,
    | 'assetSources'
    | 'directUploads'
    | 'imageUrlBuilder'
    | 'observeAsset'
    | 'readOnly'
    | 'schemaType'
    | 'value'
  > & {
    handleOpenDialog: () => void
    handleRemoveButtonClick: () => void
    handleSelectFiles: (files: File[]) => void
    handleSelectImageFromAssetSource: (source: AssetSource) => void
    isImageToolEnabled: boolean
    isMenuOpen: boolean
    setHotspotButtonElement: (el: HTMLButtonElement | null) => void
    setMenuButtonElement: (el: HTMLButtonElement | null) => void
    setMenuOpen: (isOpen: boolean) => void
  },
) {
  const {
    assetSources,
    directUploads,
    handleOpenDialog,
    handleRemoveButtonClick,
    handleSelectFiles,
    handleSelectImageFromAssetSource,
    imageUrlBuilder,
    isImageToolEnabled,
    isMenuOpen,
    observeAsset,
    readOnly,
    schemaType,
    setHotspotButtonElement,
    setMenuButtonElement,
    setMenuOpen,
    value,
  } = props
  const {t} = useTranslation()

  const accept = useMemo(() => get(schemaType, 'options.accept', 'image/*'), [schemaType])
  const asset = value?.asset

  const showAdvancedEditButton = value && asset && isImageToolEnabled

  if (!asset) {
    return null
  }

  let browseMenuItem: ReactNode =
    assetSources && assetSources.length === 0 ? null : (
      <MenuItem
        icon={SearchIcon}
        text={t('inputs.image.browse-menu.text')}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={() => {
          setMenuOpen(false)
          handleSelectImageFromAssetSource(assetSources[0])
        }}
        disabled={readOnly}
        data-testid="file-input-browse-button"
      />
    )
  if (assetSources && assetSources.length > 1) {
    browseMenuItem = assetSources.map((assetSource) => {
      return (
        <MenuItem
          key={assetSource.name}
          text={
            (assetSource.i18nKey ? t(assetSource.i18nKey) : assetSource.title) ||
            startCase(assetSource.name)
          }
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => {
            setMenuOpen(false)
            handleSelectImageFromAssetSource(assetSource)
          }}
          icon={assetSource.icon || ImageIcon}
          data-testid={`file-input-browse-button-${assetSource.name}`}
          disabled={readOnly}
        />
      )
    })
  }

  return (
    <ImageInputAssetMenuWithReferenceAsset
      accept={accept}
      browseMenuItem={browseMenuItem}
      directUploads={directUploads}
      handleOpenDialog={handleOpenDialog}
      handleRemoveButtonClick={handleRemoveButtonClick}
      handleSelectFiles={handleSelectFiles}
      imageUrlBuilder={imageUrlBuilder}
      isMenuOpen={isMenuOpen}
      observeAsset={observeAsset}
      readOnly={readOnly}
      reference={asset}
      schemaType={schemaType}
      setHotspotButtonElement={setHotspotButtonElement}
      setMenuButtonElement={setMenuButtonElement}
      setMenuOpen={setMenuOpen}
      showAdvancedEditButton={!!showAdvancedEditButton}
      value={value}
    />
  )
}
export const ImageInputAssetMenu = memo(ImageInputAssetMenuComponent)

function ImageInputAssetMenuWithReferenceAssetComponent(
  props: Pick<
    BaseImageInputProps,
    'directUploads' | 'imageUrlBuilder' | 'observeAsset' | 'readOnly' | 'schemaType' | 'value'
  > & {
    accept: string
    browseMenuItem: ReactNode
    handleOpenDialog: () => void
    handleRemoveButtonClick: () => void
    handleSelectFiles: (files: File[]) => void
    isMenuOpen: boolean
    observeAsset: (assetId: string) => Observable<ImageAsset>
    reference: Reference
    setHotspotButtonElement: (el: HTMLButtonElement | null) => void
    setMenuButtonElement: (el: HTMLButtonElement | null) => void
    setMenuOpen: (isOpen: boolean) => void
    showAdvancedEditButton: boolean
  },
) {
  const {
    accept,
    browseMenuItem,
    directUploads,
    handleOpenDialog,
    handleRemoveButtonClick,
    handleSelectFiles,
    imageUrlBuilder,
    isMenuOpen,
    observeAsset,
    readOnly,
    reference,
    setHotspotButtonElement,
    setMenuButtonElement,
    setMenuOpen,
    showAdvancedEditButton,
    value,
  } = props

  const documentId = reference?._ref
  const observable = useMemo(() => observeAsset(documentId), [documentId, observeAsset])
  const asset = useObservable(observable)

  if (!documentId || !asset) {
    return <ImageActionsMenuWaitPlaceholder />
  }

  const {_id, originalFilename, extension} = asset
  let copyUrl: string | undefined
  let downloadUrl: string | undefined

  if (isImageSource(value)) {
    const filename = originalFilename || `download.${extension}`
    downloadUrl = imageUrlBuilder.image(_id).forceDownload(filename).url()
    copyUrl = imageUrlBuilder.image(_id).url()
  }

  return (
    <ImageActionsMenu
      isMenuOpen={isMenuOpen}
      onEdit={handleOpenDialog}
      onMenuOpen={setMenuOpen}
      setHotspotButtonElement={setHotspotButtonElement}
      setMenuButtonElement={setMenuButtonElement}
      showEdit={!!showAdvancedEditButton}
    >
      <ActionsMenu
        onUpload={handleSelectFiles}
        browse={browseMenuItem}
        onReset={handleRemoveButtonClick}
        downloadUrl={downloadUrl}
        copyUrl={copyUrl}
        readOnly={readOnly}
        directUploads={directUploads}
        accept={accept}
      />
    </ImageActionsMenu>
  )
}
const ImageInputAssetMenuWithReferenceAsset = memo(ImageInputAssetMenuWithReferenceAssetComponent)
