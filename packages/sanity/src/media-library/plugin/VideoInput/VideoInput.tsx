import {type SanityClient} from '@sanity/client'
import {
  type AssetFromSource,
  type AssetSource,
  type AssetSourceUploader,
  type UploadState,
} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {get} from 'lodash'
import {Fragment, useCallback, useEffect, useRef, useState} from 'react'
import {type Observable} from 'rxjs'

import {handleSelectAssetFromSource as handleSelectAssetFromSourceShared} from '../../../core/form/inputs/files/common/assetSource'
import {type FileInfo} from '../../../core/form/inputs/files/common/styles'
import {MemberField} from '../../../core/form/members/object/MemberField'
import {MemberFieldError} from '../../../core/form/members/object/MemberFieldError'
import {MemberFieldSet} from '../../../core/form/members/object/MemberFieldset'
import {PatchEvent} from '../../../core/form/patch/PatchEvent'
import {set, setIfMissing, unset} from '../../../core/form/patch/patch'
import {UPLOAD_STATUS_KEY} from '../../../core/form/studio/uploads/constants'
import {resolveUploader} from '../../../core/form/studio/uploads/resolveUploader'
import {
  type Uploader,
  type UploaderResolver,
  type UploadOptions,
} from '../../../core/form/studio/uploads/types'
import {createInitialUploadPatches} from '../../../core/form/studio/uploads/utils'
import type {ObjectInputProps} from '../../../core/form/types/inputProps'
import {useTranslation} from '../../../core/i18n/hooks/useTranslation'
import {
  type VideoAsset,
  type VideoSchemaType,
  type VideoValue as BaseVideoValue,
} from '../schemas/types'
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
export interface BaseVideoInputValue extends Partial<BaseVideoValue> {
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

  const assetSourceUploaderRef = useRef<{
    unsubscribe: () => void
    uploader: AssetSourceUploader
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

  const cancelExternalFileToDatasetUpload = useCallback(() => {
    if (uploadSubscriptionRef.current) {
      uploadSubscriptionRef.current?.unsubscribe()
      handleClearUploadStatus()
    }
  }, [handleClearUploadStatus])

  // This function is used to upload an external video to the dataset
  // when selecting an asset from an asset source that is of type 'video'
  const uploadExternalFileToDataset = useCallback(
    (uploader: Uploader, video: globalThis.File, assetDocumentProps: UploadOptions = {}) => {
      const {source} = assetDocumentProps
      const options = {
        metadata: get(schemaType, 'options.metadata'),
        storeOriginalFilename: get(schemaType, 'options.storeOriginalFilename'),
        source,
      }
      cancelExternalFileToDatasetUpload()
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
      cancelExternalFileToDatasetUpload,
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
        uploadWith: uploadExternalFileToDataset,
      })
      setSelectedAssetSource(null)
      setIsUploading(false) // This function is also called on after a successful upload completion though an asset source, so reset that state here.
    },
    [onChange, schemaType, uploadExternalFileToDataset],
  )

  const handleSelectFilesToUpload = useCallback(
    (assetSource: AssetSource, files: File[]) => {
      if (files.length === 0) {
        return
      }
      setSelectedAssetSource(assetSource)
      if (assetSource.Uploader) {
        const uploader = new assetSource.Uploader()
        // Unsubscribe from the previous uploader
        assetSourceUploaderRef.current?.unsubscribe()
        try {
          assetSourceUploaderRef.current = {
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
                  break
                default:
              }
            }),
            uploader,
          }
          setIsUploading(true)
          onChange(PatchEvent.from(createInitialUploadPatches(files[0])))
          uploader.upload(files, {schemaType, onChange: onChange as (patch: unknown) => void})
        } catch (error) {
          onChange(PatchEvent.from([unset([UPLOAD_STATUS_KEY])]))
          setIsUploading(false)
          assetSourceUploaderRef.current?.unsubscribe()
          setSelectedAssetSource(null)
          assetSourceUploaderRef.current = null
          push({
            status: 'error',
            description: t('asset-sources.common.uploader.upload-failed.description'),
            title: t('asset-sources.common.uploader.upload-failed.title'),
          })
          console.error(error)
        }
      }
    },
    [onChange, push, schemaType, t],
  )

  // Abort asset source uploads and unsubscribe from the uploader is the component unmounts
  useEffect(() => {
    return () => {
      assetSourceUploaderRef.current?.uploader?.abort()
      assetSourceUploaderRef.current?.unsubscribe()
    }
  }, [])

  const handleCancelUpload = useCallback(() => {
    assetSourceUploaderRef.current?.uploader?.abort()
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
        onSelectFiles={handleSelectFilesToUpload}
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
    handleSelectFilesToUpload,
    handleStaleUpload,
    hoveringFiles,
    isBrowseMenuOpen,
    isStale,
    isUploading,
    props,
    selectedAssetSource,
    browseButtonElementRef,
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

        return (
          <Fragment
            key={
              //@ts-expect-error all possible cases should be covered
              member.key
            }
          >
            {t('inputs.file.error.unknown-member-kind', {
              //@ts-expect-error all possible cases should be covered
              kind: member.kind,
            })}
          </Fragment>
        )
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
          onSelectFiles={handleSelectFilesToUpload}
          selectedAssetSource={selectedAssetSource}
          setBrowseButtonElement={setBrowseButtonElement}
          setHoveringFiles={setHoveringFiles}
          setIsBrowseMenuOpen={setIsBrowseMenuOpen}
          setIsUploading={setIsUploading}
          setSelectedAssetSource={setSelectedAssetSource}
          uploader={assetSourceUploaderRef.current?.uploader}
        />
      )}
    </>
  )
}
