import {isFileSource} from '@sanity/asset-utils'
import {ImageIcon, SearchIcon, UploadIcon} from '@sanity/icons'
import {type AssetSource, type FileAsset} from '@sanity/types'
import get from 'lodash-es/get.js'
import startCase from 'lodash-es/startCase.js'
import {type ReactNode, useCallback, useMemo, useState} from 'react'

import {MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {WithReferencedAsset} from '../../../utils/WithReferencedAsset'
import {ActionsMenu} from '../common/ActionsMenu'
import {
  getAssetSourceDisplayName,
  getAssetSourcesWithUpload,
  isComponentModeAssetSource,
} from '../common/assetSourceUtils'
import {FileInputMenuItem} from '../common/FileInputMenuItem/FileInputMenuItem'
import {findOpenInSourceResult, getOpenInSourceName} from '../common/openInSource'
import {UploadDropDownMenu} from '../common/UploadDropDownMenu'
import {type AssetAccessPolicy} from '../types'
import {FileActionsMenu} from './FileActionsMenu'
import {FileSkeleton} from './FileSkeleton'
import {type FileAssetProps} from './types'

export function FilePreview(props: FileAssetProps) {
  const {
    accessPolicy,
    assetSources,
    clearField,
    directUploads,
    observeAsset,
    onOpenInSource,
    onOpenSourceForUpload,
    onSelectAssetSourceForBrowse,
    onSelectFiles,
    readOnly,
    schemaType,
    setBrowseButtonElement,
    value,
  } = props
  const {t} = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const asset = value?.asset
  const sourcesFromSchema = schemaType.options?.sources

  const accept = get(schemaType, 'options.accept', '')

  const assetSourcesWithUpload = getAssetSourcesWithUpload(assetSources)

  const handleSelectFileMenuItemClicked = useCallback(
    (event: React.MouseEvent) => {
      setIsMenuOpen(false)
      const assetSourceNameData = event.currentTarget.getAttribute('data-asset-source-name')
      const assetSource = assetSources.find((source) => source.name === assetSourceNameData)
      if (assetSource) {
        onSelectAssetSourceForBrowse?.(assetSource)
      } else {
        console.warn(
          `No asset source found for the selected asset source name '${assetSourceNameData}'`,
        )
      }
    },
    [assetSources, onSelectAssetSourceForBrowse],
  )

  const handleSelectFilesFromAssetSource = useCallback(
    (assetSource: AssetSource, files: File[]) => {
      setIsMenuOpen(false)
      onSelectFiles(assetSource, files)
    },
    [onSelectFiles],
  )

  const handleSelectFilesFromAssetSourceSingle = useCallback(
    (files: File[]) => {
      handleSelectFilesFromAssetSource(assetSourcesWithUpload[0], files)
    },
    [assetSourcesWithUpload, handleSelectFilesFromAssetSource],
  )

  // Handler for component mode single source
  const handleOpenSourceForUploadSingle = useCallback(() => {
    setIsMenuOpen(false)
    if (onOpenSourceForUpload) {
      onOpenSourceForUpload(assetSourcesWithUpload[0])
    }
  }, [assetSourcesWithUpload, onOpenSourceForUpload])

  const browseMenuItem: ReactNode = useMemo(() => {
    // Legacy support for setting asset sources to an empty array through schema
    // Will still allow for uploading files through the default studio asset source,
    // but not selecting existing assets
    if (sourcesFromSchema?.length === 0) {
      return null
    }
    if (assetSources.length === 0) {
      return null
    }

    if (assetSources.length === 1) {
      return (
        <MenuItem
          icon={SearchIcon}
          text={t('inputs.file.browse-button.text')}
          onClick={handleSelectFileMenuItemClicked}
          disabled={readOnly}
          data-testid={`file-input-browse-button-${assetSources[0].name}`}
          data-asset-source-name={assetSources[0].name}
        />
      )
    }
    return assetSources.map((assetSource) => {
      return (
        <MenuItem
          key={assetSource.name}
          text={getAssetSourceDisplayName(assetSource, t, {useStartCaseForName: true})}
          onClick={handleSelectFileMenuItemClicked}
          icon={assetSource.icon || ImageIcon}
          disabled={readOnly}
          data-testid={`file-input-browse-button-${assetSource.name}`}
          data-asset-source-name={assetSource.name}
        />
      )
    })
  }, [assetSources, handleSelectFileMenuItemClicked, readOnly, sourcesFromSchema?.length, t])

  const uploadMenuItem: ReactNode = useMemo(() => {
    switch (assetSourcesWithUpload.length) {
      case 0:
        return null
      case 1: {
        const singleSource = assetSourcesWithUpload[0]
        // For component mode, render a menu item that opens the source directly
        if (isComponentModeAssetSource(singleSource)) {
          return (
            <MenuItem
              icon={UploadIcon}
              onClick={handleOpenSourceForUploadSingle}
              data-asset-source-name={singleSource.name}
              text={t('inputs.files.common.actions-menu.upload.label')}
              data-testid={`file-input-upload-button-${singleSource.name}`}
              disabled={readOnly || directUploads === false}
            />
          )
        }
        // For picker mode, use the file input menu item
        return (
          <FileInputMenuItem
            icon={UploadIcon}
            onSelect={handleSelectFilesFromAssetSourceSingle}
            accept={accept}
            data-asset-source-name={singleSource.name}
            text={t('inputs.files.common.actions-menu.upload.label')}
            data-testid={`file-input-upload-button-${singleSource.name}`}
            disabled={readOnly || directUploads === false}
          />
        )
      }
      default:
        return (
          <UploadDropDownMenu
            accept={accept}
            assetSources={assetSourcesWithUpload}
            directUploads={directUploads}
            onSelectFiles={handleSelectFilesFromAssetSource}
            onOpenSourceForUpload={onOpenSourceForUpload}
            readOnly={readOnly}
            data-testid="file-input-upload-drop-down-menu-button"
            renderAsMenuGroup
          />
        )
    }
  }, [
    accept,
    assetSourcesWithUpload,
    directUploads,
    handleOpenSourceForUploadSingle,
    handleSelectFilesFromAssetSource,
    handleSelectFilesFromAssetSourceSingle,
    onOpenSourceForUpload,
    readOnly,
    t,
  ])

  if (!asset) {
    return null
  }

  return (
    <WithReferencedAsset
      reference={asset}
      observeAsset={observeAsset}
      waitPlaceholder={<FileSkeleton />}
    >
      {(fileAsset: FileAsset) => (
        <FilePreviewContent
          accessPolicy={accessPolicy}
          assetSources={assetSources}
          browseMenuItem={browseMenuItem}
          clearField={clearField}
          fileAsset={fileAsset}
          isMenuOpen={isMenuOpen}
          onOpenInSource={onOpenInSource}
          readOnly={readOnly}
          setIsMenuOpen={setIsMenuOpen}
          setBrowseButtonElement={setBrowseButtonElement}
          uploadMenuItem={uploadMenuItem}
          value={value}
        />
      )}
    </WithReferencedAsset>
  )
}

function FilePreviewContent({
  accessPolicy,
  assetSources,
  browseMenuItem,
  clearField,
  fileAsset,
  isMenuOpen,
  onOpenInSource,
  readOnly,
  setIsMenuOpen,
  setBrowseButtonElement,
  uploadMenuItem,
  value,
}: {
  accessPolicy?: AssetAccessPolicy
  assetSources: AssetSource[]
  browseMenuItem: ReactNode
  clearField: () => void
  fileAsset: FileAsset
  isMenuOpen: boolean
  onOpenInSource: (assetSource: AssetSource, asset: FileAsset) => void
  readOnly?: boolean
  setIsMenuOpen: (isOpen: boolean) => void
  setBrowseButtonElement: (element: HTMLButtonElement | null) => void
  uploadMenuItem: ReactNode
  value: FileAssetProps['value']
}) {
  const {t} = useTranslation()
  const {_id, originalFilename, extension, url, size} = fileAsset
  const filename = originalFilename || `download.${extension}`
  let copyUrl: string | undefined
  let downloadUrl: string | undefined

  if (
    isFileSource(value) &&
    // @todo Temporary check to prevent showing download and copy links for
    // private assets until support is added
    accessPolicy !== 'private'
  ) {
    downloadUrl = `${url}?dl`
    copyUrl = url
  }

  // Find the first asset source that can handle opening this asset in source
  const openInSourceResult = useMemo(
    () => findOpenInSourceResult(fileAsset, assetSources),
    [fileAsset, assetSources],
  )

  const handleOpenInSource = useCallback(() => {
    if (!openInSourceResult) return

    setIsMenuOpen(false)
    const {source, result} = openInSourceResult
    if (result.type === 'url') {
      window.open(result.url, result.target || '_blank')
    } else if (result.type === 'component') {
      onOpenInSource?.(source, fileAsset)
    }
  }, [fileAsset, onOpenInSource, openInSourceResult, setIsMenuOpen])

  return (
    <FileActionsMenu
      accessPolicy={accessPolicy}
      size={size}
      originalFilename={filename}
      muted={!readOnly}
      onMenuOpen={setIsMenuOpen}
      isMenuOpen={isMenuOpen}
      setMenuButtonElement={setBrowseButtonElement}
    >
      <ActionsMenu
        browse={browseMenuItem}
        upload={uploadMenuItem}
        onReset={clearField}
        downloadUrl={downloadUrl}
        copyUrl={copyUrl}
        openInSource={openInSourceResult ? handleOpenInSource : undefined}
        openInSourceName={getOpenInSourceName(openInSourceResult, t)}
        readOnly={readOnly}
      />
    </FileActionsMenu>
  )
}
