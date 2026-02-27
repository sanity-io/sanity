import {isImageSource} from '@sanity/asset-utils'
import {ImageIcon, SearchIcon, UploadIcon} from '@sanity/icons'
import {type AssetSource, type ImageAsset, type Reference} from '@sanity/types'
import {get, startCase} from 'lodash-es'
import {memo, type ReactNode, useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable} from 'rxjs'

import {MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {ActionsMenu} from '../common/ActionsMenu'
import {FileInputMenuItem} from '../common/FileInputMenuItem/FileInputMenuItem'
import {findOpenInSourceResult, getOpenInSourceName} from '../common/openInSource'
import {UploadDropDownMenu} from '../common/UploadDropDownMenu'
import {type AssetAccessPolicy} from '../types'
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
    accessPolicy?: AssetAccessPolicy
    handleOpenDialog: () => void
    handleRemoveButtonClick: () => void
    onSelectFile: (assetSource: AssetSource, file: File) => void
    handleSelectImageFromAssetSource: (source: AssetSource) => void
    isImageToolEnabled: boolean
    isMenuOpen: boolean
    setHotspotButtonElement: (el: HTMLButtonElement | null) => void
    setMenuButtonElement: (el: HTMLButtonElement | null) => void
    setMenuOpen: (isOpen: boolean) => void
    onOpenInSource: (assetSource: AssetSource, asset: ImageAsset) => void
  },
) {
  const {
    accessPolicy,
    assetSources,
    directUploads,
    handleOpenDialog,
    handleRemoveButtonClick,
    onSelectFile,
    handleSelectImageFromAssetSource,
    imageUrlBuilder,
    isImageToolEnabled,
    isMenuOpen,
    observeAsset,
    onOpenInSource,
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
      accessPolicy={accessPolicy}
      assetSources={assetSources}
      browseMenuItem={browseMenuItem}
      directUploads={directUploads}
      handleOpenDialog={handleOpenDialog}
      handleRemoveButtonClick={handleRemoveButtonClick}
      onSelectFile={onSelectFile}
      imageUrlBuilder={imageUrlBuilder}
      isMenuOpen={isMenuOpen}
      observeAsset={observeAsset}
      onOpenInSource={onOpenInSource}
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
    accessPolicy?: AssetAccessPolicy
    assetSources: AssetSource[]
    browseMenuItem: ReactNode
    handleOpenDialog: () => void
    handleRemoveButtonClick: () => void
    onSelectFile: (assetSource: AssetSource, file: File) => void
    onOpenInSource: (assetSource: AssetSource, asset: ImageAsset) => void
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
    accessPolicy,
    assetSources,
    browseMenuItem,
    directUploads,
    handleOpenDialog,
    handleRemoveButtonClick,
    onSelectFile,
    imageUrlBuilder,
    isMenuOpen,
    onOpenInSource,
    observeAsset,
    readOnly,
    reference,
    setHotspotButtonElement,
    setMenuButtonElement,
    setMenuOpen,
    showAdvancedEditButton,
    value,
  } = props

  const {t} = useTranslation()

  const documentId = reference?._ref
  const observable = useMemo(() => observeAsset(documentId), [documentId, observeAsset])
  const asset = useObservable(observable)
  const assetSourcesWithUpload = assetSources.filter((s) => Boolean(s.Uploader))

  // Find the first asset source that can handle opening this asset in source
  const openInSourceResult = useMemo(
    () => (asset ? findOpenInSourceResult(asset, assetSources) : null),
    [asset, assetSources],
  )

  const handleSelectFilesFromAssetSource = useCallback(
    (assetSource: AssetSource, files: File[]) => {
      onSelectFile(assetSource, files[0])
    },
    [onSelectFile],
  )

  const handleSelectFilesFromAssetSourceSingle = useCallback(
    (files: File[]) => {
      handleSelectFilesFromAssetSource(assetSourcesWithUpload[0], files)
    },
    [assetSourcesWithUpload, handleSelectFilesFromAssetSource],
  )

  const handleOpenInSource = useCallback(() => {
    if (!openInSourceResult || !asset) return

    const {source, result} = openInSourceResult
    if (result.type === 'url') {
      window.open(result.url, result.target || '_blank')
    } else if (result.type === 'component') {
      onOpenInSource?.(source, asset)
    }
  }, [asset, onOpenInSource, openInSourceResult])

  if (!documentId || !asset) {
    return <ImageActionsMenuWaitPlaceholder />
  }

  const {_id, originalFilename, extension} = asset
  let copyUrl: string | undefined
  let downloadUrl: string | undefined

  if (
    isImageSource(value) &&
    // @todo Temporary check to prevent showing download and copy links for
    // private assets until support is added
    accessPolicy !== 'private'
  ) {
    const filename = originalFilename || `download.${extension}`
    downloadUrl = imageUrlBuilder.image(_id).forceDownload(filename).url()
    copyUrl = imageUrlBuilder.image(_id).url()
  }

  let uploadMenuItem: ReactNode = null
  switch (assetSourcesWithUpload.length) {
    case 0:
      uploadMenuItem = null
      break
    case 1:
      uploadMenuItem = (
        <FileInputMenuItem
          icon={UploadIcon}
          onSelect={handleSelectFilesFromAssetSourceSingle}
          accept={accept}
          data-asset-source-name={assetSourcesWithUpload[0].name}
          text={t('inputs.files.common.actions-menu.upload.label')}
          data-testid="file-input-upload-button"
          disabled={readOnly || directUploads === false}
        />
      )
      break
    default:
      uploadMenuItem = (
        <UploadDropDownMenu
          accept={accept}
          assetSources={assetSourcesWithUpload}
          directUploads={directUploads}
          onSelectFiles={handleSelectFilesFromAssetSource}
          readOnly={readOnly}
          renderAsMenuGroup
        />
      )
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
        upload={uploadMenuItem}
        browse={browseMenuItem}
        onReset={handleRemoveButtonClick}
        downloadUrl={downloadUrl}
        openInSource={openInSourceResult ? handleOpenInSource : undefined}
        openInSourceName={getOpenInSourceName(openInSourceResult, t)}
        copyUrl={copyUrl}
        readOnly={readOnly}
      />
    </ImageActionsMenu>
  )
}
const ImageInputAssetMenuWithReferenceAsset = memo(ImageInputAssetMenuWithReferenceAssetComponent)
