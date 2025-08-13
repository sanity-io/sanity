import {type SanityClient} from '@sanity/client'
import {
  type AssetFromSource,
  type AssetSource,
  type AssetSourceUploader,
  type File as BaseFile,
  type FileAsset,
  type FileSchemaType,
  type UploadState,
} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {get} from 'lodash'
import {Fragment, useCallback, useEffect, useRef, useState} from 'react'
import {type Observable} from 'rxjs'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {MemberField} from '../../../members/object/MemberField'
import {MemberFieldError} from '../../../members/object/MemberFieldError'
import {MemberFieldSet} from '../../../members/object/MemberFieldset'
import {PatchEvent} from '../../../patch/PatchEvent'
import {set, setIfMissing, unset} from '../../../patch/patch'
import {UPLOAD_STATUS_KEY} from '../../../studio/uploads/constants'
import {resolveUploader} from '../../../studio/uploads/resolveUploader'
import {
  type Uploader,
  type UploaderResolver,
  type UploadOptions,
} from '../../../studio/uploads/types'
import {createInitialUploadPatches} from '../../../studio/uploads/utils'
import type {ObjectInputProps} from '../../../types/inputProps'
import {handleSelectAssetFromSource as handleSelectAssetFromSourceShared} from '../common/assetSource'
import {type FileInfo} from '../common/styles'
import {FileAsset as FileAssetComponent} from './FileAsset'
import {FileAssetSource} from './FileInputAssetSource'

/**
 * @hidden
 * @beta */
export interface BaseFileInputValue extends Partial<BaseFile> {
  _upload?: UploadState
}

function passThrough({children}: {children?: React.ReactNode}) {
  return children
}

/**
 * @hidden
 * @beta */
export interface BaseFileInputProps extends ObjectInputProps<BaseFileInputValue, FileSchemaType> {
  assetSources: AssetSource[]
  directUploads?: boolean
  observeAsset: (documentId: string) => Observable<FileAsset>
  resolveUploader: UploaderResolver
  client: SanityClient
}

/** @internal */
export function BaseFileInput(props: BaseFileInputProps) {
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

  // This function is used to upload an external file to the dataset
  // when selecting an asset from an asset source that is of type 'file' or 'base64'.
  const uploadExternalFileToDataset = useCallback(
    (uploader: Uploader, file: globalThis.File, assetDocumentProps: UploadOptions = {}) => {
      const {source} = assetDocumentProps
      const options = {
        metadata: get(schemaType, 'options.metadata'),
        storeOriginalFilename: get(schemaType, 'options.storeOriginalFilename'),
        source,
      }
      cancelExternalFileToDatasetUpload()
      setIsUploading(true)
      onChange(PatchEvent.from([setIfMissing({_type: schemaType.name})]))
      uploadSubscriptionRef.current = uploader.upload(client, file, schemaType, options).subscribe({
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
      if (assetsFromSource.length === 0) {
        return
      }
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
                  event.files.forEach((file) => {
                    console.error(file.error)
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
        } catch (err) {
          onChange(PatchEvent.from([unset([UPLOAD_STATUS_KEY])]))
          setIsUploading(false)
          setSelectedAssetSource(null)
          assetSourceUploaderRef.current?.unsubscribe()
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
      assetSourceUploaderRef.current?.uploader?.abort()
      assetSourceUploaderRef.current?.unsubscribe()
    }
  }, [])

  const handleCancelUpload = useCallback(() => {
    assetSourceUploaderRef.current?.uploader?.abort()
  }, [])

  const renderAsset = useCallback(() => {
    return (
      <FileAssetComponent
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
        <FileAssetSource
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
