import {isImageSource} from '@sanity/asset-utils'
import {
  type AssetFromSource,
  type AssetSource,
  type AssetSourceUploader,
  type UploadState,
} from '@sanity/types'
import {Stack, useToast} from '@sanity/ui'
import {get} from 'lodash'
import {
  Fragment,
  memo,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {type Subscription} from 'rxjs'

import {useTranslation} from '../../../../i18n'
import {useAssetLimitsUpsellContext} from '../../../../limits/context/assets/AssetLimitUpsellProvider'
import {isAssetLimitError} from '../../../../limits/context/assets/isAssetLimitError'
import {FormInput} from '../../../components'
import {MemberField, MemberFieldError, MemberFieldSet} from '../../../members'
import {PatchEvent, set, setIfMissing, unset} from '../../../patch'
import {type FieldMember} from '../../../store'
import {UPLOAD_STATUS_KEY} from '../../../studio/uploads/constants'
import {type Uploader, type UploadOptions} from '../../../studio/uploads/types'
import {createInitialUploadPatches} from '../../../studio/uploads/utils'
import {type InputProps} from '../../../types'
import {handleSelectAssetFromSource as handleSelectAssetFromSourceShared} from '../common/assetSource'
import {UploadProgress} from '../common/UploadProgress'
import {ImageInputAsset} from './ImageInputAsset'
import {ImageInputAssetMenu} from './ImageInputAssetMenu'
import {ImageInputAssetSource} from './ImageInputAssetSource'
import {ImageInputBrowser} from './ImageInputBrowser'
import {ImageInputHotspotInput} from './ImageInputHotspotInput'
import {ImageInputPreview} from './ImageInputPreview'
import {ImageInputUploadPlaceholder} from './ImageInputUploadPlaceholder'
import {InvalidImageWarning} from './InvalidImageWarning'
import {type BaseImageInputProps, type BaseImageInputValue, type FileInfo} from './types'

export {BaseImageInputProps, BaseImageInputValue}

function BaseImageInputComponent(props: BaseImageInputProps): React.JSX.Element {
  const {
    assetSources,
    client,
    directUploads,
    elementProps,
    focusPath,
    id,
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

  const [selectedAssetSource, setSelectedAssetSource] = useState<AssetSource | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [hoveringFiles, setHoveringFiles] = useState<FileInfo[]>([])
  const [isStale, setIsStale] = useState(false)
  const [hotspotButtonElement, setHotspotButtonElement] = useState<HTMLButtonElement | null>(null)
  // Get the menu button element in `ImageActionsMenu` so that focus can be restored to
  // it when closing the dialog (see `handleAssetSourceClosed`)
  const [menuButtonElement, setMenuButtonElement] = useState<HTMLButtonElement | null>(null)
  const [isMenuOpen, setMenuOpen] = useState(false)
  const {handleOpenDialog: handleAssetLimitUpsellDialog} = useAssetLimitsUpsellContext()

  const uploadSubscription = useRef<null | Subscription>(null)

  const [assetSourceUploader, setAssetSourceUploader] = useState<{
    unsubscribe: () => void
    uploader: AssetSourceUploader
  } | null>(null)

  const getFileTone = useCallback(() => {
    const acceptedFiles = hoveringFiles.filter((file) => resolveUploader(schemaType, file))
    const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length

    if (hoveringFiles.length > 0) {
      if (rejectedFilesCount > 0 || directUploads === false) {
        return 'critical'
      }
    }

    if (!value?._upload && !readOnly && hoveringFiles.length > 0) {
      return 'primary'
    }

    if (readOnly) {
      return 'transparent'
    }

    return value?._upload && value?.asset ? 'transparent' : 'default'
  }, [
    directUploads,
    hoveringFiles,
    readOnly,
    resolveUploader,
    schemaType,
    value?._upload,
    value?.asset,
  ])
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
    [cancelUpload, clearUploadStatus, client, onChange, push, schemaType, t],
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
        isImage: true,
      })

      setSelectedAssetSource(null)
      setIsUploading(false) // This function is also called on after a successful upload completion though an asset source, so reset that state here.
    },
    [onChange, resolveUploader, schemaType, uploadWith],
  )

  const handleCancelUpload = useCallback(() => {
    cancelUpload()
  }, [cancelUpload])

  const handleClearUploadState = useCallback(() => {
    setIsStale(false)
    clearUploadStatus()
  }, [clearUploadStatus])

  const handleStaleUpload = useCallback(() => {
    setIsStale(true)
  }, [])

  const handleSelectFilesToUpload = useCallback(
    (assetSource: AssetSource, files: File[]) => {
      if (files.length === 0) {
        return
      }
      setSelectedAssetSource(assetSource)
      if (assetSource.Uploader) {
        // Workaround for React Compiler not yet fully supporting try/catch/finally syntax
        const run = () => {
          const uploader = new assetSource.Uploader!()
          // Unsubscribe from the previous uploader
          assetSourceUploader?.unsubscribe()
          setAssetSourceUploader({
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
                case 'all-complete': {
                  // Asset limit errors only come through after all file uploads attemps have been made
                  const hasAssetLimitError = event.files.some(
                    (file) => file.status === 'error' && isAssetLimitError(file.error),
                  )
                  if (hasAssetLimitError) {
                    handleAssetLimitUpsellDialog('field_action')
                  }
                  onChange(PatchEvent.from([unset([UPLOAD_STATUS_KEY])]))
                  setMenuOpen(false)
                  break
                }
                default:
              }
            }),
            uploader,
          })
          setIsUploading(true)
          onChange(PatchEvent.from(createInitialUploadPatches(files[0])))
          uploader.upload(files, {schemaType, onChange: onChange as (patch: unknown) => void})
        }
        try {
          run()
        } catch (err) {
          onChange(PatchEvent.from([unset([UPLOAD_STATUS_KEY])]))
          setIsUploading(false)
          assetSourceUploader?.unsubscribe()
          setSelectedAssetSource(null)
          setAssetSourceUploader(null)
          push({
            status: 'error',
            description: t('asset-sources.common.uploader.upload-failed.description'),
            title: t('asset-sources.common.uploader.upload-failed.title'),
          })
          console.error(err)
        }
      }
    },
    [handleAssetLimitUpsellDialog, assetSourceUploader, onChange, push, schemaType, t],
  )

  // Abort asset source uploads and unsubscribe from the uploader is the component unmounts
  useEffect(() => {
    return () => {
      assetSourceUploader?.uploader?.abort()
      assetSourceUploader?.unsubscribe()
    }
  }, [assetSourceUploader])

  const handleSelectImageFromAssetSource = useCallback((source: AssetSource) => {
    setSelectedAssetSource(source)
  }, [])

  const handleAssetSourceClosed = useCallback(() => {
    setSelectedAssetSource(null)

    // Set focus on menu button in `ImageActionsMenu` when closing the dialog
    menuButtonElement?.focus()
  }, [menuButtonElement])

  const renderPreview = useCallback<() => React.JSX.Element>(() => {
    if (!value) {
      return <></>
    }
    return (
      <ImageInputPreview
        client={client}
        directUploads={directUploads}
        handleOpenDialog={handleOpenDialog}
        hoveringFiles={hoveringFiles}
        imageUrlBuilder={imageUrlBuilder}
        readOnly={readOnly}
        resolveUploader={resolveUploader}
        schemaType={schemaType}
        value={value}
      />
    )
  }, [
    client,
    directUploads,
    handleOpenDialog,
    hoveringFiles,
    imageUrlBuilder,
    readOnly,
    resolveUploader,
    schemaType,
    value,
  ])
  const renderAssetMenu = useCallback(() => {
    return (
      <ImageInputAssetMenu
        assetSources={assetSources}
        directUploads={directUploads}
        handleOpenDialog={handleOpenDialog}
        handleRemoveButtonClick={handleRemoveButtonClick}
        onSelectFiles={handleSelectFilesToUpload}
        handleSelectImageFromAssetSource={handleSelectImageFromAssetSource}
        imageUrlBuilder={imageUrlBuilder}
        isImageToolEnabled={isImageToolEnabled()}
        isMenuOpen={isMenuOpen}
        observeAsset={observeAsset}
        readOnly={readOnly}
        schemaType={schemaType}
        setHotspotButtonElement={setHotspotButtonElement}
        setMenuButtonElement={setMenuButtonElement}
        setMenuOpen={setMenuOpen}
        value={value}
      />
    )
  }, [
    assetSources,
    directUploads,
    handleOpenDialog,
    handleRemoveButtonClick,
    handleSelectFilesToUpload,
    handleSelectImageFromAssetSource,
    imageUrlBuilder,
    isImageToolEnabled,
    isMenuOpen,
    observeAsset,
    readOnly,
    schemaType,
    value,
  ])

  const renderBrowser = useCallback(() => {
    return (
      <ImageInputBrowser
        assetSources={assetSources}
        readOnly={readOnly}
        id={id}
        setMenuOpen={setMenuOpen}
        schemaType={schemaType}
        handleSelectImageFromAssetSource={handleSelectImageFromAssetSource}
      />
    )
  }, [assetSources, handleSelectImageFromAssetSource, id, readOnly, schemaType])
  const renderUploadPlaceholder = useCallback(() => {
    return (
      <ImageInputUploadPlaceholder
        assetSources={assetSources}
        directUploads={directUploads}
        onSelectFiles={handleSelectFilesToUpload}
        hoveringFiles={hoveringFiles}
        readOnly={readOnly}
        renderBrowser={renderBrowser}
        resolveUploader={resolveUploader}
        schemaType={schemaType}
      />
    )
  }, [
    assetSources,
    directUploads,
    handleSelectFilesToUpload,
    hoveringFiles,
    readOnly,
    renderBrowser,
    resolveUploader,
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
          hoveringFiles={hoveringFiles}
          inputProps={inputProps}
          isStale={isStale}
          onSelectFiles={handleSelectFilesToUpload}
          readOnly={readOnly}
          renderAssetMenu={renderAssetMenu}
          renderPreview={renderPreview}
          renderUploadPlaceholder={renderUploadPlaceholder}
          renderUploadState={renderUploadState}
          schemaType={schemaType}
          setHoveringFiles={setHoveringFiles}
          selectedAssetSource={selectedAssetSource}
          tone={getFileTone()}
          value={value}
        />
      )
    },
    [
      assetSources,
      directUploads,
      elementProps,
      getFileTone,
      handleClearField,
      handleClearUploadState,
      handleSelectFilesToUpload,
      hoveringFiles,
      isStale,
      readOnly,
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
          isImageToolEnabled={isImageToolEnabled()}
          handleCloseDialog={handleCloseDialog}
          imageInputProps={props}
          inputProps={inputProps}
        />
      )
    },
    [handleCloseDialog, isImageToolEnabled, props],
  )
  const renderAssetSource = useCallback(() => {
    return (
      <ImageInputAssetSource
        handleAssetSourceClosed={handleAssetSourceClosed}
        handleSelectAssetFromSource={handleSelectAssetFromSource}
        isUploading={isUploading}
        observeAsset={observeAsset}
        schemaType={schemaType}
        selectedAssetSource={selectedAssetSource}
        uploader={assetSourceUploader?.uploader}
        value={value}
      />
    )
  }, [
    assetSourceUploader?.uploader,
    handleAssetSourceClosed,
    handleSelectAssetFromSource,
    isUploading,
    observeAsset,
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
      {members.map((member) => {
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
