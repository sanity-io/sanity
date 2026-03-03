import {type SanityClient} from '@sanity/client'
import {
  type AssetFromSource,
  type AssetSource,
  type File as BaseFile,
  type FileAsset,
  type FileSchemaType,
  type UploadState,
} from '@sanity/types'
import {Fragment, useCallback, useState} from 'react'
import {type Observable} from 'rxjs'

import {useTranslation} from '../../../../i18n'
import {useAssetLimitsUpsellContext} from '../../../../limits/context/assets/AssetLimitUpsellProvider'
import {MemberField, MemberFieldError, MemberFieldSet} from '../../../members'
import {MemberDecoration} from '../../../members/object/MemberDecoration'
import {useRenderMembers} from '../../../members/object/useRenderMembers'
import {unset} from '../../../patch'
import {resolveUploader} from '../../../studio/uploads/resolveUploader'
import {type UploaderResolver} from '../../../studio/uploads/types'
import {type ObjectInputProps} from '../../../types'
import {handleSelectAssetFromSource as handleSelectAssetFromSourceShared} from '../common/assetSource'
import {AssetSourceDialog} from '../common/AssetSourceDialog'
import {type FileInfo} from '../common/styles'
import {useAssetSource} from '../common/useAssetSource'
import {useAssetSourceFocusRestoration} from '../common/useAssetSourceFocusRestoration'
import {useUploadExternalFileToDataset} from '../common/useUploadExternalFileToDataset'
import {useAccessPolicy} from '../ImageInput/useAccessPolicy'
import {FileAsset as FileAssetComponent} from './FileAsset'
import {FileSkeleton} from './FileSkeleton'

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
  const {t} = useTranslation()
  const renderedMembers = useRenderMembers(schemaType, members)

  const [hoveringFiles, setHoveringFiles] = useState<FileInfo[]>([])
  const [isBrowseMenuOpen, setIsBrowseMenuOpen] = useState(false)
  const {handleOpenDialog: handleAssetLimitUpsellDialog} = useAssetLimitsUpsellContext()

  const {
    action: assetSourceAction,
    selectedAssetSource,
    openInSourceAsset,
    setSelectedAssetSource,
    openForBrowse: handleSelectAssetSourceForBrowse,
    openForUpload: handleOpenSourceForUpload,
    openInSource: handleOpenInSource,
    changeAction: handleAssetSourceChangeAction,
    close: assetSourceClose,
    resetOnComplete: handleAssetSourceResetOnComplete,
    isUploading,
    setIsUploading,
    isStale,
    setIsStale,
    onStale: handleStaleUpload,
    assetSourceUploader,
    handleSelectFilesToUpload,
  } = useAssetSource<FileAsset>({
    onChange,
    schemaType,
    onAssetLimitError: () => handleAssetLimitUpsellDialog('field_action'),
  })

  const {menuButtonRef, handleAssetSourceClosed} = useAssetSourceFocusRestoration(assetSourceClose)

  const {uploadWith: uploadExternalFileToDataset, clearUploadStatus} =
    useUploadExternalFileToDataset({
      client,
      schemaType,
      onChange,
      setIsUploading,
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
      handleAssetSourceResetOnComplete()
    },
    [handleAssetSourceResetOnComplete, onChange, schemaType, uploadExternalFileToDataset],
  )

  const accessPolicy = useAccessPolicy({
    client,
    source: value,
  })

  const handleCancelUpload = useCallback(() => {
    assetSourceUploader?.uploader?.abort()
  }, [assetSourceUploader])

  const renderAsset = useCallback(() => {
    return (
      <FileAssetComponent
        {...props}
        accessPolicy={accessPolicy}
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
    accessPolicy,
    handleCancelUpload,
    handleClearField,
    menuButtonRef,
    handleClearUploadStatus,
    handleOpenInSource,
    handleOpenSourceForUpload,
    handleSelectAssetSourceForBrowse,
    handleSelectAssets,
    handleSelectFilesToUpload,
    handleStaleUpload,
    hoveringFiles,
    isBrowseMenuOpen,
    isStale,
    isUploading,
    props,
    selectedAssetSource,
    setIsUploading,
    setSelectedAssetSource,
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
        if (member.kind === 'error') {
          return <MemberFieldError key={member.key} member={member} />
        }
        if (member.kind === 'decoration') {
          return <MemberDecoration key={member.key} member={member} />
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
          assetType="file"
          observeAsset={props.observeAsset}
          onClose={handleAssetSourceClosed}
          onChangeAction={handleAssetSourceChangeAction}
          onSelect={handleSelectAssets}
          openInSourceAsset={openInSourceAsset}
          schemaType={props.schemaType}
          selectedAssetSource={selectedAssetSource}
          uploader={assetSourceUploader?.uploader}
          value={props.value}
          waitPlaceholder={<FileSkeleton />}
        />
      )}
    </>
  )
}
