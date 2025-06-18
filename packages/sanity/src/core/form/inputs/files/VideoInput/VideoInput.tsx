/* eslint-disable import/no-unresolved,react/jsx-handler-names, react/display-name, react/no-this-in-sfc */

import {type SanityClient} from '@sanity/client'
import {
  type AssetFromSource,
  type AssetSource,
  type UploadState,
  type Video as BaseVideo,
  type VideoAsset,
  type VideoSchemaType,
} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {get} from 'lodash'
import {useCallback, useEffect, useRef, useState} from 'react'
import {type Observable} from 'rxjs'

import {useTranslation} from '../../../../i18n'
import {MemberField, MemberFieldError, MemberFieldSet} from '../../../members'
import {PatchEvent, set, setIfMissing, unset} from '../../../patch'
import {UPLOAD_STATUS_KEY} from '../../../studio/uploads/constants'
import {resolveUploader} from '../../../studio/uploads/resolveUploader'
import {
  type Uploader,
  type UploaderResolver,
  type UploadOptions,
} from '../../../studio/uploads/types'
import {createInitialUploadPatches} from '../../../studio/uploads/utils'
import {type ObjectInputProps} from '../../../types'
import {handleSelectAssetFromSource as handleSelectAssetFromSourceShared} from '../common/assetSource'
import {type FileInfo} from '../common/styles'
import {VideoAsset as VideoAssetComponent} from './VideoAsset'
import {VideoInputAssetSource} from './VideoInputAssetSource'

export type VideoUploadState = UploadState & {
  _pendingProcessing?: boolean
  _assetId?: string
  _assetInstanceId?: string
}

/**
 * @hidden
 * @beta */
export interface BaseVideoInputValue extends Partial<BaseVideo> {
  _upload?: VideoUploadState
}

function passThrough({children}: {children?: React.ReactNode}) {
  return children
}

/**
 * @hidden
 * @beta */
export interface BaseVideoInputProps
  extends ObjectInputProps<BaseVideoInputValue, VideoSchemaType> {
  assetSources: AssetSource[]
  directUploads?: boolean
  observeAsset: (documentId: string) => Observable<VideoAsset>
  resolveUploader: UploaderResolver
  client: SanityClient
}

/** @internal */
export function BaseVideoInput(props: BaseVideoInputProps) {
  const {
    client,
    members,
    onChange,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
    schemaType,
    value,
  } = props
  const {push} = useToast()
  const {t} = useTranslation()
  const [hoveringFiles, setHoveringFiles] = useState<FileInfo[]>([])
  const [isStale, setIsStale] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isBrowseMenuOpen, setIsBrowseMenuOpen] = useState(false)
  const [selectedAssetSource, setSelectedAssetSource] = useState<AssetSource | null>(null)

  const browseButtonElementRef = useRef<HTMLButtonElement>(null)

  const uploaderRef = useRef<{
    unsubscribe: () => void
    uploader: AssetSource['uploader']
  } | null>(null)

  const setBrowseButtonElement = useCallback(
    (element: HTMLButtonElement | null) => {
      if (element) {
        browseButtonElementRef.current = element
      }
    },
    [browseButtonElementRef],
  )

  const uploadSubscriptionRef = useRef<{unsubscribe: () => void} | null>(null)

  const handleClearField = useCallback(() => {
    onChange([unset(['asset']), unset(['media'])])
  }, [onChange])

  const handleClearUploadStatus = useCallback(() => {
    if (value?._upload) {
      onChange(PatchEvent.from([unset(['_upload'])]))
    }
  }, [onChange, value?._upload])

  const handleStaleUpload = useCallback(() => {
    setIsStale(true)
  }, [])

  const cancelExternalVideoToDatasetUpload = useCallback(() => {
    if (uploadSubscriptionRef.current) {
      uploadSubscriptionRef.current?.unsubscribe()
      handleClearUploadStatus()
    }
  }, [handleClearUploadStatus])

  // This function is used to upload an external video to the dataset
  // when selecting an asset from an asset source that is of type 'video' or 'base64'.
  const uploadExternalVideoToDataset = useCallback(
    (uploader: Uploader, video: globalThis.File, assetDocumentProps: UploadOptions = {}) => {
      const {source} = assetDocumentProps
      const options = {
        metadata: get(schemaType, 'options.metadata'),
        storeOriginalFilename: get(schemaType, 'options.storeOriginalFilename'),
        source,
      }
      cancelExternalVideoToDatasetUpload()
      setIsUploading(true)
      onChange(PatchEvent.from([setIfMissing({_type: schemaType.name})]))
      uploadSubscriptionRef.current = uploader
        .upload(client, video, schemaType, options)
        .subscribe({
          next: (uploadEvent) => {
            if (uploadEvent.patches) {
              onChange(PatchEvent.from(uploadEvent.patches))
            }
          },
          error: (err) => {
            // eslint-disable-next-line no-console
            console.error(err)
            push({
              status: 'error',
              description: t('inputs.file.upload-failed.description'),
              title: t('inputs.file.upload-failed.title'),
            })
            handleClearUploadStatus()
          },
          complete: () => {
            setIsUploading(false)
          },
        })
    },
    [
      cancelExternalVideoToDatasetUpload,
      handleClearUploadStatus,
      client,
      onChange,
      push,
      schemaType,
      t,
    ],
  )

  const handleSelectAssets = useCallback(
    (assetsFromSource: AssetFromSource[]) => {
      handleSelectAssetFromSourceShared({
        assetsFromSource,
        onChange,
        type: schemaType,
        resolveUploader,
        uploadWith: uploadExternalVideoToDataset,
      })
      setSelectedAssetSource(null)
    },
    [onChange, schemaType, uploadExternalVideoToDataset],
  )

  const handleSelectVideosToUpload = useCallback(
    (assetSource: AssetSource, videos: File[]) => {
      if (videos.length === 0) {
        return
      }
      setSelectedAssetSource(assetSource)
      const uploader = assetSource.uploader
      if (uploader) {
        // Unsubscribe from the previous uploader
        uploaderRef.current?.unsubscribe()
        try {
          uploaderRef.current = {
            unsubscribe: uploader.subscribe((event) => {
              switch (event.type) {
                case 'progress':
                  onChange(
                    PatchEvent.from([
                      set(Math.max(2, event.progress), [UPLOAD_STATUS_KEY, 'progress']),
                      set(new Date().toISOString(), [UPLOAD_STATUS_KEY, 'updatedAt']),
                    ]),
                  )
                  break
                case 'error':
                  event.files.forEach((video) => {
                    console.error(video.error)
                  })
                  push({
                    status: 'error',
                    description: t('asset-sources.common.uploader.upload-failed.description'),
                    title: t('asset-sources.common.uploader.upload-failed.title'),
                  })
                  break
                case 'all-complete':
                  onChange(PatchEvent.from([unset([UPLOAD_STATUS_KEY])]))
                  setSelectedAssetSource(null)
                  setIsUploading(false)
                  break
                default:
              }
            }),
            uploader: assetSource.uploader,
          }
          setIsUploading(true)
          onChange(PatchEvent.from(createInitialUploadPatches(videos[0])))
          uploader.upload(videos, {schemaType, onChange: onChange as (patch: unknown) => void})
        } catch (err) {
          onChange(PatchEvent.from([unset([UPLOAD_STATUS_KEY])]))
          setIsUploading(false)
          setSelectedAssetSource(null)
          uploaderRef.current = null
          push({
            status: 'error',
            description: t('asset-sources.common.uploader.upload-failed.description'),
            title: t('asset-sources.common.uploader.upload-failed.title'),
          })
          console.error(err)
        }
      }
    },
    [onChange, push, schemaType, t],
  )

  // Abort asset source uploads and unsubscribe from the uploader is the component unmounts
  useEffect(() => {
    return () => {
      if (uploaderRef.current?.uploader) {
        uploaderRef.current?.uploader.abort()
      }
      if (uploaderRef.current?.unsubscribe) {
        uploaderRef.current?.unsubscribe()
      }
    }
  }, [])

  const handleCancelUpload = useCallback(() => {
    if (uploaderRef.current?.uploader) {
      uploaderRef.current?.uploader.abort()
    }
  }, [])

  const renderAsset = useCallback(() => {
    return (
      <VideoAssetComponent
        {...props}
        browseButtonElementRef={browseButtonElementRef}
        clearField={handleClearField}
        hoveringFiles={hoveringFiles}
        isBrowseMenuOpen={isBrowseMenuOpen}
        isStale={isStale}
        isUploading={isUploading}
        onCancelUpload={handleCancelUpload}
        onClearUploadStatus={handleClearUploadStatus}
        onSelectAssets={handleSelectAssets}
        onSelectFiles={handleSelectVideosToUpload}
        onStale={handleStaleUpload}
        selectedAssetSource={selectedAssetSource}
        setBrowseButtonElement={setBrowseButtonElement}
        setHoveringFiles={setHoveringFiles}
        setIsBrowseMenuOpen={setIsBrowseMenuOpen}
        setIsUploading={setIsUploading}
        setSelectedAssetSource={setSelectedAssetSource}
      />
    )
  }, [
    handleCancelUpload,
    handleClearField,
    handleClearUploadStatus,
    handleSelectAssets,
    handleSelectVideosToUpload,
    handleStaleUpload,
    hoveringFiles,
    isBrowseMenuOpen,
    isStale,
    isUploading,
    props,
    selectedAssetSource,
    setBrowseButtonElement,
  ])

  return (
    <>
      {members.map((member) => {
        if (member.kind === 'field') {
          return (
            <MemberField
              key={member.key}
              member={member}
              renderAnnotation={renderAnnotation}
              renderBlock={renderBlock}
              renderField={member.name === 'asset' ? passThrough : renderField}
              renderInlineBlock={renderInlineBlock}
              renderInput={member.name === 'asset' ? renderAsset : renderInput}
              renderItem={renderItem}
              renderPreview={renderPreview}
            />
          )
        }
        if (member.kind === 'fieldSet') {
          return (
            <MemberFieldSet
              key={member.key}
              member={member}
              renderAnnotation={renderAnnotation}
              renderBlock={renderBlock}
              renderField={renderField}
              renderInlineBlock={renderInlineBlock}
              renderInput={renderInput}
              renderItem={renderItem}
              renderPreview={renderPreview}
            />
          )
        }
        if (member.kind === 'error') {
          return <MemberFieldError key={member.key} member={member} />
        }
        //@ts-expect-error all possible cases should be covered
        return <>{t('inputs.file.error.unknown-member-kind', {kind: member.kind})}</>
      })}
      {selectedAssetSource && (
        <VideoInputAssetSource
          {...props}
          browseButtonElementRef={browseButtonElementRef}
          clearField={handleClearField}
          hoveringFiles={hoveringFiles}
          isBrowseMenuOpen={isBrowseMenuOpen}
          isStale={isStale}
          isUploading={isUploading}
          onClearUploadStatus={handleClearUploadStatus}
          onStale={handleStaleUpload}
          onSelectAssets={handleSelectAssets}
          onSelectFiles={handleSelectVideosToUpload}
          selectedAssetSource={selectedAssetSource}
          setBrowseButtonElement={setBrowseButtonElement}
          setHoveringFiles={setHoveringFiles}
          setIsBrowseMenuOpen={setIsBrowseMenuOpen}
          setIsUploading={setIsUploading}
          setSelectedAssetSource={setSelectedAssetSource}
        />
      )}
    </>
  )
}
