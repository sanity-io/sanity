import {ImageIcon, SearchIcon, UploadIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'
import {get, startCase} from 'lodash'
import {type ReactNode, useCallback, useMemo, useState} from 'react'

import {ActionsMenu} from '../../../core/form/inputs/files/common/ActionsMenu'
import {FileInputMenuItem} from '../../../core/form/inputs/files/common/FileInputMenuItem/FileInputMenuItem'
import {UploadDropDownMenu} from '../../../core/form/inputs/files/common/UploadDropDownMenu'
import {WithReferencedAsset} from '../../../core/form/utils/WithReferencedAsset'
import {useTranslation} from '../../../core/i18n/hooks/useTranslation'
import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {type VideoAssetProps} from './types'
import {VideoActionsMenu} from './VideoActionsMenu'
import {VideoSkeleton} from './VideoSkeleton'

export function VideoPreview(props: VideoAssetProps) {
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

  const handleSelectVideoMenuItemClicked = useCallback(
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

  const handleSelectVideosFromAssetSource = useCallback(
    (assetSource: AssetSource, videos: File[]) => {
      setIsMenuOpen(false)
      onSelectFiles(assetSource, videos)
    },
    [onSelectFiles],
  )

  const handleSelectVideosFromAssetSourceSingle = useCallback(
    (videos: File[]) => {
      handleSelectVideosFromAssetSource(assetSourcesWithUpload[0], videos)
    },
    [assetSourcesWithUpload, handleSelectVideosFromAssetSource],
  )

  const browseMenuItem: ReactNode = useMemo(() => {
    // Legacy support for setting asset sources to an empty array through schema
    // Will still allow for uploading videos through the default studio asset source,
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
          onClick={handleSelectVideoMenuItemClicked}
          disabled={readOnly}
          data-testid={`video-input-browse-button-${assetSources[0].name}`}
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
          onClick={handleSelectVideoMenuItemClicked}
          icon={assetSource.icon || ImageIcon}
          disabled={readOnly}
          data-testid={`video-input-browse-button-${assetSource.name}`}
          data-asset-source-name={assetSource.name}
        />
      )
    })
  }, [assetSources, handleSelectVideoMenuItemClicked, readOnly, sourcesFromSchema?.length, t])

  const uploadMenuItem: ReactNode = useMemo(() => {
    switch (assetSourcesWithUpload.length) {
      case 0:
        return null
      case 1:
        return (
          <FileInputMenuItem
            icon={UploadIcon}
            onSelect={handleSelectVideosFromAssetSourceSingle}
            accept={accept}
            data-asset-source-name={assetSourcesWithUpload[0].name}
            text={t('inputs.files.common.actions-menu.upload.label')}
            data-testid={`video-input-upload-button-${assetSourcesWithUpload[0].name}`}
            disabled={readOnly || directUploads === false}
          />
        )
      default:
        return (
          <UploadDropDownMenu
            accept={accept}
            assetSources={assetSourcesWithUpload}
            directUploads={directUploads}
            onSelectFiles={handleSelectVideosFromAssetSource}
            readOnly={readOnly}
            data-testid="video-input-upload-drop-down-menu-button"
            renderAsMenuGroup
          />
        )
    }
  }, [
    accept,
    assetSourcesWithUpload,
    directUploads,
    handleSelectVideosFromAssetSource,
    handleSelectVideosFromAssetSourceSingle,
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
      waitPlaceholder={<VideoSkeleton />}
    >
      {({metadata}) => {
        // @ts-expect-error - TODO: fix this
        const playbackId = metadata?.playbacks?.[0]?._id
        const aspectRatio = metadata?.aspectRatio

        return (
          <VideoActionsMenu
            aspectRatio={aspectRatio}
            playbackId={playbackId}
            muted={!readOnly}
            onMenuOpen={setIsMenuOpen}
            isMenuOpen={isMenuOpen}
            setMenuButtonElement={setBrowseButtonElement}
          >
            <ActionsMenu
              browse={browseMenuItem}
              upload={uploadMenuItem}
              onReset={clearField}
              readOnly={readOnly}
            />
          </VideoActionsMenu>
        )
      }}
    </WithReferencedAsset>
  )
}
