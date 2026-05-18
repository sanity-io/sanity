import {isImageSource} from '@sanity/asset-utils'
import {
  type AssetFromSource,
  type AssetSource,
  type ImageAsset,
  type UploadState,
} from '@sanity/types'
import {Stack, useToast} from '@sanity/ui'
import get from 'lodash-es/get.js'
import {Fragment, memo, type ReactNode, useCallback, useMemo, useRef, useState} from 'react'
import {type Subscription} from 'rxjs'

import {useTranslation} from '../../../../i18n'
import {useAssetLimitsUpsellContext} from '../../../../limits/context/assets/AssetLimitUpsellProvider'
import {FormInput} from '../../../components'
import {MemberField, MemberFieldError, MemberFieldSet} from '../../../members'
import {MemberDecoration} from '../../../members/object/MemberDecoration'
import {useRenderMembers} from '../../../members/object/useRenderMembers'
import {setIfMissing, unset} from '../../../patch'
import {type FieldMember} from '../../../store'
import {type Uploader, type UploadOptions} from '../../../studio/uploads/types'
import {type InputProps} from '../../../types'
import {handleSelectAssetFromSource as handleSelectAssetFromSourceShared} from '../common/assetSource'
import {AssetSourceBrowser} from '../common/AssetSourceBrowser'
import {AssetSourceDialog} from '../common/AssetSourceDialog'
import {UploadProgress} from '../common/UploadProgress'
import {useAssetSource} from '../common/useAssetSource'
import {ImageAccessPolicy} from './ImageAccessPolicy'
import {ImageInputAsset} from './ImageInputAsset'
import {ImageInputAssetMenu} from './ImageInputAssetMenu'
import {ImageInputHotspotInput} from './ImageInputHotspotInput'
import {ImageInputPreview} from './ImageInputPreview'
import {ImageInputUploadPlaceholder} from './ImageInputUploadPlaceholder'
import {InvalidImageWarning} from './InvalidImageWarning'
import {type BaseImageInputProps} from './types'
import {useAccessPolicy} from './useAccessPolicy'

export {BaseImageInputProps}

function BaseImageInputComponent(props: BaseImageInputProps): React.JSX.Element {
  const {
    assetSources,
    client,
    directUploads,
    elementProps,
    focusPath,
    id: _id,
    imageUrlBuilder,
    members,
    observeAsset,
    onChange,
    onPathFocus,
    path,
    readOnly,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview: renderPreviewProp,
    resolveUploader,
    schemaType,
    value,
  } = props
  const {push} = useToast()
  const {t} = useTranslation()
  const renderedMembers = useRenderMembers(schemaType, members)

  const [hotspotButtonElement, setHotspotButtonElement] = useState<HTMLButtonElement | null>(null)
  const [isMenuOpen, setMenuOpen] = useState(false)
  const {handleOpenDialog: handleAssetLimitUpsellDialog} = useAssetLimitsUpsellContext()

  const uploadSubscription = useRef<null | Subscription>(null)

  const {
    action: assetSourceAction,
    selectedAssetSource,
    openInSourceAsset,
    openForBrowse: handleSelectImageFromAssetSource,
    openForUpload: handleOpenSourceForUpload,
    openInSource: handleOpenInSource,
    changeAction: handleAssetSourceChangeAction,
    close: handleAssetSourceClosed,
    menuButtonRef,
    resetOnComplete: handleAssetSourceResetOnComplete,
    isUploading,
    setIsUploading,
    isStale,
    setIsStale,
    onStale: handleStaleUpload,
    assetSourceUploader,
    handleSelectFilesToUpload,
  } = useAssetSource<ImageAsset>({
    client,
    onChange,
    schemaType,
    onAssetLimitError: () => handleAssetLimitUpsellDialog('field_action'),
    onAllComplete: () => setMenuOpen(false),
  })

  const handleSelectFileToUpload = useCallback(
    (assetSource: AssetSource, file: File) => {
      handleSelectFilesToUpload(assetSource, [file])
    },
    [handleSelectFilesToUpload],
  )

  const isImageToolEnabled = useCallback(() => {
    const hotspotOptions = get(schemaType, 'options.hotspot')
    return typeof hotspotOptions === 'object' || hotspotOptions === true
  }, [schemaType])
  const valueIsArrayElement = useCallback(() => {
    const parentPathSegment = path.slice(-1)[0]

    // String path segment mean an object path, while a number or a
    // keyed segment means we're a direct child of an array
    return typeof parentPathSegment !== 'string'
  }, [path])

  const clearUploadStatus = useCallback(() => {
    if (value?._upload) {
      onChange(unset(['_upload']))
    }
  }, [onChange, value?._upload])

  const cancelUpload = useCallback(() => {
    if (uploadSubscription.current) {
      uploadSubscription.current.unsubscribe()
      clearUploadStatus()
    }
  }, [clearUploadStatus])

  const uploadWith = useCallback(
    (uploader: Uploader, file: File, assetDocumentProps: UploadOptions = {}) => {
      const {label, title, description, creditLine, source} = assetDocumentProps
      const options = {
        metadata: get(schemaType, 'options.metadata'),
        storeOriginalFilename: get(schemaType, 'options.storeOriginalFilename'),
        label,
        title,
        description,
        creditLine,
        source,
      }

      cancelUpload()
      setIsUploading(true)
      onChange(setIfMissing({_type: schemaType.name}))
      uploadSubscription.current = uploader.upload(client, file, schemaType, options).subscribe({
        next: (uploadEvent) => {
          if (uploadEvent.patches) {
            onChange(uploadEvent.patches)
          }
        },
        error: (err) => {
          console.error(err)
          push({
            status: 'error',
            description: t('inputs.image.upload-error.description'),
            title: t('inputs.image.upload-error.title'),
          })
          clearUploadStatus()
        },
        complete: () => {
          onChange([unset(['hotspot']), unset(['crop']), unset(['media'])])
          setIsUploading(false)
        },
      })
    },
    [cancelUpload, clearUploadStatus, client, onChange, push, schemaType, setIsUploading, t],
  )

  const handleClearField = useCallback(() => {
    onChange([unset(['asset']), unset(['crop']), unset(['hotspot']), unset(['media'])])
  }, [onChange])

  const handleRemoveButtonClick = useCallback(() => {
    // When removing the image, we should also remove any crop and hotspot
    // _type and _key are "meta"-properties and are not significant unless
    // other properties are present. Thus, we want to remove the entire
    // "container" object if these are the only properties present, BUT
    // only if we're not an array element, as removing the array element
    // will close the selection dialog. Instead, when closing the dialog,
    // the array logic will check for an "empty" value and remove it for us
    const allKeys = Object.keys(value || {})
    const remainingKeys = allKeys.filter(
      (key) => !['_type', '_key', '_upload', 'asset', 'crop', 'hotspot', 'media'].includes(key),
    )

    const isEmpty = remainingKeys.length === 0
    const removeKeys = ['asset', 'media']
      .concat(allKeys.filter((key) => ['crop', 'hotspot', '_upload'].includes(key)))
      .map((key) => unset([key]))

    onChange(isEmpty && !valueIsArrayElement() ? unset() : removeKeys)
  }, [onChange, value, valueIsArrayElement])

  const handleOpenDialog = useCallback(() => {
    onPathFocus(['hotspot'])
  }, [onPathFocus])

  const handleCloseDialog = useCallback(() => {
    onPathFocus([])
    // Set focus on hotspot button in `ImageActionsMenu` when closing the dialog
    hotspotButtonElement?.focus()
  }, [hotspotButtonElement, onPathFocus])

  const handleSelectAssetFromSource = useCallback(
    (assetsFromSource: AssetFromSource[]) => {
      handleSelectAssetFromSourceShared({
        assetsFromSource,
        onChange,
        type: schemaType,
        resolveUploader,
        uploadWith,
      })
      handleAssetSourceResetOnComplete()
    },
    [handleAssetSourceResetOnComplete, onChange, resolveUploader, schemaType, uploadWith],
  )

  const handleCancelUpload = useCallback(() => {
    cancelUpload()
    assetSourceUploader?.uploader?.abort()
  }, [assetSourceUploader, cancelUpload])

  const handleClearUploadState = useCallback(() => {
    setIsStale(false)
    clearUploadStatus()
  }, [clearUploadStatus, setIsStale])

  const accessPolicy = useAccessPolicy({
    client,
    source: value,
  })

  const renderPreview = useCallback<() => React.JSX.Element>(() => {
    if (!value) {
      return <></>
    }
    return (
      <ImageInputPreview
        accessPolicy={accessPolicy}
        handleOpenDialog={handleOpenDialog}
        imageUrlBuilder={imageUrlBuilder}
        readOnly={readOnly}
        value={value}
      />
    )
  }, [accessPolicy, handleOpenDialog, imageUrlBuilder, readOnly, value])

  const renderAssetAccessPolicy = useCallback(() => {
    return <ImageAccessPolicy accessPolicy={accessPolicy} />
  }, [accessPolicy])

  const renderAssetMenu = useCallback(() => {
    return (
      <ImageInputAssetMenu
        accessPolicy={accessPolicy}
        assetSources={assetSources}
        directUploads={directUploads}
        handleOpenDialog={handleOpenDialog}
        handleRemoveButtonClick={handleRemoveButtonClick}
        onSelectFile={handleSelectFileToUpload}
        onOpenSourceForUpload={handleOpenSourceForUpload}
        handleSelectImageFromAssetSource={handleSelectImageFromAssetSource}
        imageUrlBuilder={imageUrlBuilder}
        isImageToolEnabled={isImageToolEnabled()}
        isMenuOpen={isMenuOpen}
        observeAsset={observeAsset}
        onOpenInSource={handleOpenInSource}
        readOnly={readOnly}
        schemaType={schemaType}
        setHotspotButtonElement={setHotspotButtonElement}
        menuButtonRef={menuButtonRef}
        setMenuOpen={setMenuOpen}
        value={value}
      />
    )
  }, [
    accessPolicy,
    assetSources,
    directUploads,
    handleOpenDialog,
    handleOpenInSource,
    handleOpenSourceForUpload,
    handleRemoveButtonClick,
    handleSelectFileToUpload,
    handleSelectImageFromAssetSource,
    imageUrlBuilder,
    isImageToolEnabled,
    isMenuOpen,
    menuButtonRef,
    observeAsset,
    readOnly,
    schemaType,
    value,
  ])

  const renderBrowser = useCallback(() => {
    return (
      <AssetSourceBrowser
        assetSources={assetSources}
        readOnly={readOnly}
        schemaType={schemaType}
        onSelectAssetSource={handleSelectImageFromAssetSource}
      />
    )
  }, [assetSources, handleSelectImageFromAssetSource, readOnly, schemaType])

  const disableNew = schemaType.options?.disableNew === true

  const renderUploadPlaceholder = useCallback(() => {
    return (
      <ImageInputUploadPlaceholder
        assetSources={assetSources}
        directUploads={directUploads}
        disableNew={disableNew}
        onSelectFile={handleSelectFileToUpload}
        onOpenSourceForUpload={handleOpenSourceForUpload}
        readOnly={readOnly}
        renderBrowser={renderBrowser}
        schemaType={schemaType}
      />
    )
  }, [
    assetSources,
    directUploads,
    disableNew,
    handleOpenSourceForUpload,
    handleSelectFileToUpload,
    readOnly,
    renderBrowser,
    schemaType,
  ])
  const renderUploadState = useCallback(
    (uploadState: UploadState) => {
      return (
        <UploadProgress
          uploadState={uploadState}
          onCancel={isUploading ? handleCancelUpload : undefined}
          onStale={handleStaleUpload}
        />
      )
    },
    [handleCancelUpload, handleStaleUpload, isUploading],
  )
  const renderAsset = useCallback(
    (inputProps: Omit<InputProps, 'renderDefault'>) => {
      if (value && typeof value.asset !== 'undefined' && !value?._upload && !isImageSource(value)) {
        return <InvalidImageWarning onClearValue={handleClearField} />
      }
      return (
        <ImageInputAsset
          assetSources={assetSources}
          directUploads={directUploads !== false}
          elementProps={elementProps}
          handleClearUploadState={handleClearUploadState}
          inputProps={inputProps}
          isStale={isStale}
          onOpenSourceForUpload={handleOpenSourceForUpload}
          onSelectFile={handleSelectFileToUpload}
          readOnly={readOnly}
          renderAssetAccessPolicy={renderAssetAccessPolicy}
          renderAssetMenu={renderAssetMenu}
          renderPreview={renderPreview}
          renderUploadPlaceholder={renderUploadPlaceholder}
          renderUploadState={renderUploadState}
          schemaType={schemaType}
          selectedAssetSource={selectedAssetSource}
          value={value}
        />
      )
    },
    [
      assetSources,
      directUploads,
      elementProps,
      handleClearField,
      handleClearUploadState,
      handleOpenSourceForUpload,
      handleSelectFileToUpload,
      isStale,
      readOnly,
      renderAssetAccessPolicy,
      renderAssetMenu,
      renderPreview,
      renderUploadPlaceholder,
      renderUploadState,
      schemaType,
      selectedAssetSource,
      value,
    ],
  )
  const renderHotspotInput = useCallback(
    (inputProps: Omit<InputProps, 'renderDefault'>) => {
      return (
        <ImageInputHotspotInput
          accessPolicy={accessPolicy}
          isImageToolEnabled={isImageToolEnabled()}
          handleCloseDialog={handleCloseDialog}
          imageInputProps={props}
          inputProps={inputProps}
        />
      )
    },
    [accessPolicy, handleCloseDialog, isImageToolEnabled, props],
  )
  const renderAssetSource = useCallback(() => {
    if (!selectedAssetSource) return null
    if (!assetSourceAction) return null
    return (
      <AssetSourceDialog
        action={assetSourceAction}
        assetType="image"
        observeAsset={observeAsset}
        onClose={handleAssetSourceClosed}
        onChangeAction={handleAssetSourceChangeAction}
        onSelect={handleSelectAssetFromSource}
        openInSourceAsset={openInSourceAsset}
        schemaType={schemaType}
        selectedAssetSource={selectedAssetSource}
        uploader={assetSourceUploader?.uploader}
        value={value}
      />
    )
  }, [
    assetSourceAction,
    assetSourceUploader?.uploader,
    handleAssetSourceClosed,
    handleAssetSourceChangeAction,
    handleSelectAssetFromSource,
    observeAsset,
    openInSourceAsset,
    schemaType,
    selectedAssetSource,
    value,
  ])

  // we use the hotspot field as the "owner" of both hotspot and crop
  const hotspotField = useMemo(
    () =>
      members.find(
        (member): member is FieldMember => member.kind === 'field' && member.name === 'hotspot',
      ),
    [members],
  )

  return (
    // The Stack space should match the space in ObjectInput
    <Stack space={5} data-testid="image-input">
      {renderedMembers.map((member) => {
        if (member.kind === 'field' && (member.name === 'crop' || member.name === 'hotspot')) {
          // we're rendering these separately
          return null
        }

        if (member.kind === 'field') {
          return (
            <MemberField
              key={member.key}
              member={member}
              renderAnnotation={renderAnnotation}
              renderBlock={renderBlock}
              renderInlineBlock={renderInlineBlock}
              renderInput={member.name === 'asset' ? renderAsset : renderInput}
              renderField={member.name === 'asset' ? passThrough : renderField}
              renderItem={renderItem}
              renderPreview={renderPreviewProp}
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
              renderPreview={renderPreviewProp}
              schemaType={schemaType}
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
            {t('inputs.image.error.unknown-member-kind', {
              //@ts-expect-error all possible cases should be covered
              kind: member.kind,
            })}
          </Fragment>
        )
      })}

      {hotspotField && focusPath[0] === 'hotspot' && (
        <FormInput
          {...props}
          absolutePath={hotspotField.field.path}
          renderInput={renderHotspotInput}
        />
      )}
      {selectedAssetSource && renderAssetSource()}
    </Stack>
  )
}

/** @internal */
export const BaseImageInput = memo(BaseImageInputComponent)

function passThrough({children}: {children?: ReactNode}) {
  return children
}
