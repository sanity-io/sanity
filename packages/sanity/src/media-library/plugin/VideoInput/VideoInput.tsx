import {type SanityClient} from '@sanity/client'
import {type AssetFromSource, type AssetSource, type UploadState} from '@sanity/types'
import {Fragment, useCallback, useState} from 'react'
import {type Observable} from 'rxjs'

import {handleSelectAssetFromSource as handleSelectAssetFromSourceShared} from '../../../core/form/inputs/files/common/assetSource'
import {AssetSourceDialog} from '../../../core/form/inputs/files/common/AssetSourceDialog'
import {type FileInfo} from '../../../core/form/inputs/files/common/styles'
import {useAssetSource} from '../../../core/form/inputs/files/common/useAssetSource'
import {MemberField, MemberFieldError, MemberFieldSet} from '../../../core/form/members'
import {MemberDecoration} from '../../../core/form/members/object/MemberDecoration'
import {useRenderMembers} from '../../../core/form/members/object/useRenderMembers'
import {unset} from '../../../core/form/patch'
import {resolveUploader} from '../../../core/form/studio/uploads/resolveUploader'
import {type UploaderResolver} from '../../../core/form/studio/uploads/types'
import {type ObjectInputProps} from '../../../core/form/types'
import {useTranslation} from '../../../core/i18n'
import {
  type VideoAsset,
  type VideoSchemaType,
  type VideoValue as BaseVideoValue,
} from '../schemas/types'
import {VideoAsset as VideoAssetComponent} from './VideoAsset'
import {VideoSkeleton} from './VideoSkeleton'

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
export interface BaseVideoInputProps extends ObjectInputProps<
  BaseVideoInputValue,
  VideoSchemaType
> {
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
    observeAsset,
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
  const {t} = useTranslation()
  const renderedMembers = useRenderMembers(schemaType, members)
  const [hoveringFiles, setHoveringFiles] = useState<FileInfo[]>([])
  const [isBrowseMenuOpen, setIsBrowseMenuOpen] = useState(false)

  const {
    action: assetSourceAction,
    selectedAssetSource,
    openInSourceAsset,
    openForBrowse: handleSelectAssetSourceForBrowse,
    openForUpload: handleOpenSourceForUpload,
    openInSource: handleOpenInSource,
    changeAction: handleAssetSourceChangeAction,
    clearUploadStatus,
    close: handleAssetSourceClosed,
    menuButtonRef,
    resetOnComplete: handleAssetSourceResetOnComplete,
    setSelectedAssetSource,
    uploadWith: uploadExternalFileToDataset,
    isUploading,
    setIsUploading,
    isStale,
    setIsStale,
    onStale: handleStaleUpload,
    assetSourceUploader,
    handleSelectFilesToUpload,
  } = useAssetSource({
    client,
    onChange,
    schemaType,
  })

  const handleClearUploadStatus = useCallback(() => {
    if (value?._upload) {
      clearUploadStatus()
      setIsStale(false)
    }
  }, [clearUploadStatus, setIsStale, value?._upload])

  const handleClearField = useCallback(() => {
    onChange([unset(['asset']), unset(['media'])])
  }, [onChange])

  const handleSelectAssets = useCallback(
    (assetsFromSource: AssetFromSource[]) => {
      handleSelectAssetFromSourceShared({
        assetsFromSource,
        onChange,
        type: schemaType,
        resolveUploader,
        uploadWith: uploadExternalFileToDataset,
      })
      handleAssetSourceResetOnComplete()
    },
    [handleAssetSourceResetOnComplete, onChange, schemaType, uploadExternalFileToDataset],
  )

  const handleCancelUpload = useCallback(() => {
    assetSourceUploader?.uploader?.abort()
  }, [assetSourceUploader])

  const renderAsset = useCallback(() => {
    return (
      <VideoAssetComponent
        {...props}
        menuButtonRef={menuButtonRef}
        clearField={handleClearField}
        hoveringFiles={hoveringFiles}
        isBrowseMenuOpen={isBrowseMenuOpen}
        isStale={isStale}
        isUploading={isUploading}
        onCancelUpload={handleCancelUpload}
        onClearUploadStatus={handleClearUploadStatus}
        onOpenInSource={handleOpenInSource}
        onOpenSourceForUpload={handleOpenSourceForUpload}
        onSelectAssetSourceForBrowse={handleSelectAssetSourceForBrowse}
        onSelectAssets={handleSelectAssets}
        onSelectFiles={handleSelectFilesToUpload}
        onStale={handleStaleUpload}
        selectedAssetSource={selectedAssetSource}
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
    handleOpenInSource,
    handleOpenSourceForUpload,
    handleSelectAssets,
    handleSelectAssetSourceForBrowse,
    handleSelectFilesToUpload,
    handleStaleUpload,
    hoveringFiles,
    isBrowseMenuOpen,
    isStale,
    isUploading,
    menuButtonRef,
    props,
    selectedAssetSource,
    setSelectedAssetSource,
    setIsUploading,
  ])

  return (
    <>
      {renderedMembers.map((member) => {
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
        if (member.kind === 'decoration') {
          return <MemberDecoration key={member.key} member={member} />
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
      {selectedAssetSource && assetSourceAction && (
        <AssetSourceDialog
          action={assetSourceAction}
          assetType="sanity.video"
          observeAsset={observeAsset}
          onClose={handleAssetSourceClosed}
          onChangeAction={handleAssetSourceChangeAction}
          onSelect={handleSelectAssets}
          openInSourceAsset={openInSourceAsset}
          schemaType={props.schemaType}
          selectedAssetSource={selectedAssetSource}
          uploader={assetSourceUploader?.uploader}
          value={props.value}
          waitPlaceholder={<VideoSkeleton />}
        />
      )}
    </>
  )
}
