import {isFileSource} from '@sanity/asset-utils'
import {ImageIcon, SearchIcon, UploadIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'
import {get, startCase} from 'lodash'
import {type ReactNode, useCallback, useMemo, useState} from 'react'

import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {WithReferencedAsset} from '../../../utils/WithReferencedAsset'
import {ActionsMenu} from '../common/ActionsMenu'
import {FileInputMenuItem} from '../common/FileInputMenuItem/FileInputMenuItem'
import {UploadDropDownMenu} from '../common/UploadDropDownMenu'
import {FileActionsMenu} from './FileActionsMenu'
import {FileSkeleton} from './FileSkeleton'
import {type FileAssetProps} from './types'

export function FilePreview(props: FileAssetProps) {
  const {
    assetSources,
    clearField,
    directUploads,
    onSelectFiles,
    observeAsset,
    readOnly,
    schemaType,
    setBrowseButtonElement,
    setSelectedAssetSource,
    value,
  } = props
  const {t} = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const asset = value?.asset
  const sourcesFromSchema = schemaType.options?.sources

  const accept = get(schemaType, 'options.accept', '')

  const assetSourcesWithUpload = assetSources.filter((s) => Boolean(s.Uploader))

  const handleSelectFileMenuItemClicked = useCallback(
    (event: React.MouseEvent) => {
      setIsMenuOpen(false)
      const assetSourceNameData = event.currentTarget.getAttribute('data-asset-source-name')
      const assetSource = assetSources.find((source) => source.name === assetSourceNameData)
      if (assetSource) {
        setSelectedAssetSource(assetSource)
      } else {
        console.warn(
          `No asset source found for the selected asset source name '${assetSourceNameData}'`,
        )
      }
    },
    [assetSources, setSelectedAssetSource],
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
          text={
            (assetSource.i18nKey ? t(assetSource.i18nKey) : assetSource.title) ||
            startCase(assetSource.name)
          }
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
      case 1:
        return (
          <FileInputMenuItem
            icon={UploadIcon}
            onSelect={handleSelectFilesFromAssetSourceSingle}
            accept={accept}
            data-asset-source-name={assetSourcesWithUpload[0].name}
            text={t('inputs.files.common.actions-menu.upload.label')}
            data-testid={`file-input-upload-button-${assetSourcesWithUpload[0].name}`}
            disabled={readOnly || directUploads === false}
          />
        )
      default:
        return (
          <UploadDropDownMenu
            accept={accept}
            assetSources={assetSourcesWithUpload}
            directUploads={directUploads}
            onSelectFiles={handleSelectFilesFromAssetSource}
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
    handleSelectFilesFromAssetSource,
    handleSelectFilesFromAssetSourceSingle,
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
      {({originalFilename, extension, url, size}) => {
        const filename = originalFilename || `download.${extension}`
        let copyUrl: string | undefined
        let downloadUrl: string | undefined

        if (isFileSource(value)) {
          downloadUrl = `${url}?dl`
          copyUrl = url
        }

        return (
          <FileActionsMenu
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
              readOnly={readOnly}
            />
          </FileActionsMenu>
        )
      }}
    </WithReferencedAsset>
  )
}
