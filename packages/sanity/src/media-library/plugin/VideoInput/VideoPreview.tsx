import {ImageIcon, SearchIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'
import get from 'lodash-es/get.js'
import {type ReactNode, useCallback, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {EMPTY} from 'rxjs'

import {ActionsMenu} from '../../../core/form/inputs/files/common/ActionsMenu'
import {
  getAssetSourceDisplayName,
  getAssetSourcesWithUpload,
} from '../../../core/form/inputs/files/common/assetSourceUtils'
import {
  findOpenInSourceResult,
  getOpenInSourceName,
} from '../../../core/form/inputs/files/common/openInSource'
import {useUploadMenuItem} from '../../../core/form/inputs/files/common/useUploadMenuItem'
import {sourceName as MEDIA_LIBRARY_SOURCE_NAME} from '../../../core/form/studio/assetSourceMediaLibrary'
import {DEFAULT_API_VERSION} from '../../../core/form/studio/assetSourceMediaLibrary/constants'
import {useClient} from '../../../core/hooks'
import {useTranslation} from '../../../core/i18n'
import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {CUSTOM_DOMAIN_PRODUCTION, CUSTOM_DOMAIN_STAGING} from './constants'
import {getPlaybackTokens, type VideoAssetInputProps} from './types'
import {useVideoPlaybackInfo} from './useVideoPlaybackInfo'
import {VideoActionsMenu} from './VideoActionsMenu'
import {VideoSkeleton} from './VideoSkeleton'

/** @internal Exported for testing */
export function getMediaLibraryId(assetRef: string) {
  const parts = assetRef.split(':')
  if (parts.length !== 3 || parts[0] !== 'media-library' || !parts[1]) {
    throw new Error('Invalid asset reference')
  }
  return parts[1]
}

/** Extract asset container ID from a media-library ref (value.media._ref, not value.asset._ref) */
function getAssetContainerIdFromRef(ref: string): string | null {
  if (!ref?.startsWith('media-library:')) return null
  const parts = ref.split(':')
  if (parts.length !== 3 || !parts[2]) return null
  return parts[2]
}

/** Minimal asset for openInSource when observeAsset hasn't resolved yet (media-library refs).
 * Use mediaRef (value.media._ref), not assetRef (value.asset._ref) - the Media Library /assets/ URL expects the asset container ID. */
function createMinimalAssetForOpenInSource(
  mediaRef: string,
): {_id: string; _type: string; source: {id: string; name: string}} | null {
  const assetContainerId = getAssetContainerIdFromRef(mediaRef)
  if (!assetContainerId) return null
  return {
    _id: mediaRef,
    _type: 'sanity.videoAsset',
    source: {id: assetContainerId, name: MEDIA_LIBRARY_SOURCE_NAME},
  }
}

export function VideoPreview(props: VideoAssetInputProps) {
  const {
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
    setSelectedAssetSource,
    value,
  } = props
  const {t} = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const asset = value?.asset
  const mediaRef = value?.media?._ref
  const sourcesFromSchema = schemaType.options?.sources
  const accept = get(
    schemaType,
    'options.accept',
    schemaType.name === 'sanity.video' ? 'video/*' : '',
  )
  const isStaging = useClient({apiVersion: DEFAULT_API_VERSION})
    .config()
    .apiHost.endsWith('.sanity.work')

  const [videoPlaybackParams, parseError] = useMemo<
    | [null, null]
    | [{mediaLibraryId: string; assetRef: NonNullable<typeof asset>}, null]
    | [null, Error]
  >(() => {
    if (!asset?._ref) {
      return [null, null]
    }
    try {
      const mediaLibraryId = getMediaLibraryId(asset._ref)
      return [{mediaLibraryId, assetRef: asset}, null]
    } catch (error) {
      console.error('Failed to parse asset reference:', error)
      return [null, error instanceof Error ? error : new Error(String(error))]
    }
  }, [asset])

  const playbackInfoState = useVideoPlaybackInfo(videoPlaybackParams)

  const videoActionsMenuProps = useMemo(() => {
    const customDomain = isStaging ? CUSTOM_DOMAIN_STAGING : CUSTOM_DOMAIN_PRODUCTION
    const tokens = playbackInfoState?.result
      ? getPlaybackTokens(playbackInfoState.result)
      : undefined
    const baseProps = {
      aspectRatio: playbackInfoState.result?.aspectRatio,
      customDomain,
      playbackId: playbackInfoState.result?.id,
      onMenuOpen: setIsMenuOpen,
      isMenuOpen: isMenuOpen,
      setMenuButtonElement: setBrowseButtonElement,
    }

    return tokens ? {...baseProps, tokens} : baseProps
  }, [isStaging, playbackInfoState, isMenuOpen, setBrowseButtonElement])

  const assetSourcesWithUpload = getAssetSourcesWithUpload(assetSources)

  const documentId = asset?._ref
  const observable = useMemo(
    () => (documentId && observeAsset ? observeAsset(documentId) : EMPTY),
    [documentId, observeAsset],
  )
  const resolvedAsset = useObservable(observable)

  const openInSourceResult = useMemo(() => {
    if (resolvedAsset) {
      return findOpenInSourceResult(resolvedAsset, assetSources)
    }
    // Fallback: media-library refs may not resolve via observeAsset (external refs).
    // Use mediaRef (asset container), not documentId (instance) - Media Library expects asset ID.
    if (mediaRef) {
      const minimalAsset = createMinimalAssetForOpenInSource(mediaRef)
      if (minimalAsset) {
        return findOpenInSourceResult(
          minimalAsset as Parameters<typeof findOpenInSourceResult>[0],
          assetSources,
        )
      }
    }
    return null
  }, [mediaRef, resolvedAsset, assetSources])

  const handleSelectAssetSourceForBrowse = useCallback(
    (assetSource: AssetSource) => {
      setIsMenuOpen(false)
      ;(onSelectAssetSourceForBrowse ?? setSelectedAssetSource)(assetSource)
    },
    [onSelectAssetSourceForBrowse, setSelectedAssetSource],
  )

  const handleOpenInSource = useCallback(() => {
    if (!openInSourceResult) return

    setIsMenuOpen(false)
    const {source, result} = openInSourceResult
    if (result.type === 'url') {
      window.open(result.url, result.target || '_blank')
    } else if (result.type === 'component') {
      const assetContainerId = mediaRef ? getAssetContainerIdFromRef(mediaRef) : null
      const baseAsset =
        resolvedAsset ?? (mediaRef ? createMinimalAssetForOpenInSource(mediaRef) : null)
      // Ensure source.id is the asset container ID (Media Library expects this for /assets/ URL)
      const assetToOpen = baseAsset
        ? assetContainerId && baseAsset.source
          ? {...baseAsset, source: {...baseAsset.source, id: assetContainerId}}
          : baseAsset
        : null
      if (assetToOpen) {
        onOpenInSource?.(source, assetToOpen as Parameters<typeof onOpenInSource>[1])
      }
    }
  }, [mediaRef, onOpenInSource, openInSourceResult, resolvedAsset, setIsMenuOpen])

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

  const handleOpenSourceForUploadSingle = useCallback(() => {
    setIsMenuOpen(false)
    onOpenSourceForUpload?.(assetSourcesWithUpload[0])
  }, [assetSourcesWithUpload, onOpenSourceForUpload])

  // Wrapped for UploadDropDownMenu (multiple sources) - must close menu when selecting from submenu
  const handleOpenSourceForUpload = useCallback(
    (assetSource: AssetSource) => {
      setIsMenuOpen(false)
      onOpenSourceForUpload?.(assetSource)
    },
    [onOpenSourceForUpload],
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
          onClick={() => handleSelectAssetSourceForBrowse(assetSources[0])}
          disabled={readOnly}
          data-testid={`video-input-browse-button-${assetSources[0].name}`}
        />
      )
    }
    return assetSources.map((assetSource) => {
      return (
        <MenuItem
          key={assetSource.name}
          text={getAssetSourceDisplayName(assetSource, t, {useStartCaseForName: true})}
          onClick={() => handleSelectAssetSourceForBrowse(assetSource)}
          icon={assetSource.icon || ImageIcon}
          disabled={readOnly}
          data-testid={`video-input-browse-button-${assetSource.name}`}
        />
      )
    })
  }, [assetSources, handleSelectAssetSourceForBrowse, readOnly, sourcesFromSchema?.length, t])

  const uploadMenuItem = useUploadMenuItem({
    accept,
    assetSourcesWithUpload,
    directUploads,
    readOnly,
    onSelectFiles: handleSelectVideosFromAssetSource,
    onOpenSourceForUpload: handleOpenSourceForUpload,
    onOpenSourceForUploadSingle: handleOpenSourceForUploadSingle,
    onSelectFilesSingle: handleSelectVideosFromAssetSourceSingle,
    getSingleButtonTestId: (sourceName) => `video-input-upload-button-${sourceName}`,
    dropdownMenuTestId: 'video-input-upload-drop-down-menu-button',
    onCloseParentMenu: () => setIsMenuOpen(false),
  })

  if (!asset) {
    return null
  }

  if (parseError) {
    return <VideoSkeleton error={parseError} />
  }

  if (playbackInfoState.isLoading) {
    return <VideoSkeleton />
  }

  if (playbackInfoState.error) {
    return <VideoSkeleton error={playbackInfoState.error} retry={playbackInfoState.retry} />
  }

  if (!playbackInfoState.result) {
    return <VideoSkeleton />
  }

  return (
    <VideoActionsMenu {...videoActionsMenuProps}>
      <ActionsMenu
        browse={browseMenuItem}
        upload={uploadMenuItem}
        onReset={clearField}
        openInSource={openInSourceResult ? handleOpenInSource : undefined}
        openInSourceName={getOpenInSourceName(openInSourceResult, t)}
        readOnly={readOnly}
      />
    </VideoActionsMenu>
  )
}
