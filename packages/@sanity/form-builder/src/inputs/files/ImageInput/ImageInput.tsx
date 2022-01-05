/* eslint-disable import/no-unresolved */

import {FormFieldSet, ImperativeToast} from '@sanity/base/components'
import {Box, Button, Dialog, Menu, MenuButton, MenuItem, Stack, ToastParams} from '@sanity/ui'
import {get, groupBy, uniqueId} from 'lodash'
import {Observable, Subscription} from 'rxjs'
import {ChangeIndicatorForFieldPath} from '@sanity/base/change-indicators'
import {ImageIcon, SearchIcon} from '@sanity/icons'
import ImageTool from '@sanity/imagetool'
import {
  Asset as AssetDocument,
  AssetFromSource,
  Image as BaseImage,
  ImageAsset,
  ImageSchemaType,
  Marker,
  ObjectField,
  Path,
  SanityDocument,
} from '@sanity/types'
import React, {useEffect, useState, ReactElement} from 'react'
import PropTypes from 'prop-types'
import {FormFieldPresence, PresenceOverlay} from '@sanity/base/presence'
import deepCompare from 'react-fast-compare'
import HotspotImageInput from '@sanity/imagetool/HotspotImageInput'
import {
  ResolvedUploader,
  Uploader,
  UploaderResolver,
  UploadOptions,
} from '../../../sanity/uploads/types'
import {ImageToolInput} from '../ImageToolInput'
import PatchEvent, {setIfMissing, unset} from '../../../PatchEvent'
import UploadPlaceholder from '../common/UploadPlaceholder'
import WithMaterializedReference from '../../../utils/WithMaterializedReference'
import {FileTarget} from '../common/styles'
import {InternalAssetSource, UploadState} from '../types'
import {UploadProgress} from '../common/UploadProgress'
import {EMPTY_ARRAY} from '../../../utils/empty'
import {handleSelectAssetFromSource} from '../common/assetSource'
import {ActionsMenu} from '../common/ActionsMenu'
import resolveUploader from '../../../sanity/uploads/resolveUploader'
import {UploadWarning} from '../common/UploadWarning'
import {ImageInputField} from './ImageInputField'
import {ImageActionsMenu} from './ImageActionsMenu'

export interface Image extends Partial<BaseImage> {
  _upload?: UploadState
}

export type Props = {
  value?: Image
  compareValue?: Image
  type: ImageSchemaType
  level: number
  onChange: (event: PatchEvent) => void
  resolveUploader: UploaderResolver
  materialize: (documentId: string) => Observable<SanityDocument>
  onBlur: () => void
  onFocus: (path: Path) => void
  readOnly: boolean | null
  focusPath: Path
  directUploads?: boolean
  assetSources?: InternalAssetSource[]
  markers: Marker[]
  presence: FormFieldPresence[]
}

const getDevicePixelRatio = () => {
  if (typeof window === 'undefined' || !window.devicePixelRatio) {
    return 1
  }
  return Math.round(Math.max(1, window.devicePixelRatio))
}

type FileInfo = {
  type: string // mime type
  kind: string // 'file' or 'string'
}

interface FieldGroups {
  asset: ObjectField[]
  imagetool: ObjectField[]
  highlighted: ObjectField[]
  dialog: ObjectField[]
  imageToolAndDialog: ObjectField[]
}

const EMPTY_FIELD_GROUPS: FieldGroups = {
  asset: [],
  imagetool: [],
  highlighted: [],
  dialog: [],
  imageToolAndDialog: [],
}
const ASSET_FIELD_PATH = ['asset']

export default function ImageInput(props: Props) {
  const {
    type,
    value,
    compareValue,
    level,
    markers,
    readOnly,
    presence,
    focusPath = EMPTY_ARRAY,
    onChange,
    onFocus,
    directUploads,
    onBlur,
    assetSources,
    materialize,
  } = props
  const [toast, setToast] = useState(null)
  const [fieldGroups, setFieldGroups] = useState(EMPTY_FIELD_GROUPS)
  const [isStale, setIsStale] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSubscription, setUploadSubscription] = useState(null)
  const [focusElement, setFocusElement] = useState(null)
  const [hoveringFiles, setHoveringFiles] = useState([])
  const [selectedAssetSource, setSelectedAssetSource] = useState(null)
  const [isBrowsing, setIsBrowsing] = useState(false)

  const _inputId = uniqueId('ImageInput')
  const accept = get(type, 'options.accept', 'image/*')
  const isImageToolEnabled = get(type, 'options.hotspot') === true

  const acceptedFiles = hoveringFiles.filter((file) => resolveUploader(type, file))
  const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length

  // Get presence items for people who are either at the asset field, or at fields shown behind the dialog
  const fieldPresence = presence.filter(
    (item) =>
      item.path[0] === 'asset' ||
      fieldGroups.imageToolAndDialog.some((field) => item.path[0] === field.name)
  )
  const isDialogOpen =
    focusPath.length > 0 &&
    fieldGroups.dialog.concat(fieldGroups.imagetool).some((field) => focusPath[0] === field.name)

  useEffect(() => {
    const fGroups = groupBy(type.fields, (field) => {
      if (field.name === 'asset') {
        return 'asset'
      }
      if (field.name === 'hotspot' || field.name === 'crop') {
        return 'imagetool'
      }
      return (field.type as any)?.options?.isHighlighted ? 'highlighted' : 'dialog'
    })

    setFieldGroups({
      ...EMPTY_FIELD_GROUPS,
      ...fGroups,
      imageToolAndDialog: [...(fGroups.imagetool || []), ...(fGroups.dialog || [])],
    })
  }, [type])

  const getFileTone = () => {
    if (hoveringFiles.length > 0) {
      if (rejectedFilesCount > 0 || !directUploads) {
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
  }

  const clearUploadStatus = () => {
    // todo: this is kind of hackish
    if (value?._upload) {
      onChange(PatchEvent.from([unset(['_upload'])]))
    }
  }

  const handleClearState = () => {
    setIsStale(false)
    clearUploadStatus()
  }

  const cancelUpload = () => {
    if (uploadSubscription) {
      uploadSubscription.unsubscribe()
      clearUploadStatus()
    }
  }

  const handleSelectFiles = (files: File[]) => {
    if (directUploads) {
      uploadFirstAccepted(files)
    } else if (hoveringFiles.length > 0) {
      handleFilesOut()
    }
  }

  const handleFilesOver = (hoveringFilesArray: FileInfo[]) => {
    setHoveringFiles(hoveringFilesArray)
  }

  const handleFilesOut = () => {
    setHoveringFiles([])
  }

  const handleFileTargetFocus = () => {
    onFocus(['asset'])
  }

  const handleFileTargetBlur = () => {
    onBlur()
  }

  const uploadFirstAccepted = (files: File[]) => {
    const match = files
      .map((file) => ({file, uploader: resolveUploader(type, file)}))
      .find((result) => result.uploader)

    if (match) {
      uploadWith(match.uploader!, match.file)
    }
  }

  const uploadWith = (uploader: Uploader, file: File, assetDocumentProps: UploadOptions = {}) => {
    const {label, title, description, creditLine, source} = assetDocumentProps
    const options = {
      metadata: get(type, 'options.metadata'),
      storeOriginalFilename: get(type, 'options.storeOriginalFilename'),
      label,
      title,
      description,
      creditLine,
      source,
    }
    cancelUpload()
    setIsUploading(true)
    onChange(PatchEvent.from([setIfMissing({_type: type.name})]))
    const subscription = uploader.upload(file, type, options).subscribe({
      next: (uploadEvent) => {
        if (uploadEvent.patches) {
          onChange(PatchEvent.from(uploadEvent.patches))
        }
      },
      error: (err) => {
        // eslint-disable-next-line no-console
        console.error(err)
        toast?.push({
          status: 'error',
          description: 'The upload could not be completed at this time.',
          title: 'Upload failed',
        })
        clearUploadStatus()
      },
      complete: () => {
        onChange(PatchEvent.from([unset(['hotspot']), unset(['crop'])]))
        setIsUploading(false)
        // this.toast.push({
        //   status: 'success',
        //   title: 'Upload completed',
        // })
      },
    })
    setUploadSubscription(subscription)
  }

  const handleSelectImageFromAssetSource = (source: InternalAssetSource) => {
    setIsBrowsing(true)
    setSelectedAssetSource(source)
  }

  const handleOpenDialog = () => {
    const firstDialogField = isImageToolEnabled ? fieldGroups.imagetool[0] : fieldGroups.dialog[0]
    if (firstDialogField) {
      onFocus([firstDialogField.name])
    }
  }

  const handleRemoveButtonClick = () => {
    /*const {getValuePath} = this.context
    const parentPathSegment = getValuePath().slice(-1)[0]

    // String path segment mean an object path, while a number or a
    // keyed segment means we're a direct child of an array
    const isArrayElement = typeof parentPathSegment !== 'string'

    // When removing the image, we should also remove any crop and hotspot
    // _type and _key are "meta"-properties and are not significant unless
    // other properties are present. Thus, we want to remove the entire
    // "container" object if these are the only properties present, BUT
    // only if we're not an array element, as removing the array element
    // will close the selection dialog. Instead, when closing the dialog,
    // the array logic will check for an "empty" value and remove it for us
    const allKeys = Object.keys(value || {})
    const remainingKeys = allKeys.filter(
      (key) => !['_type', '_key', '_upload', 'asset', 'crop', 'hotspot'].includes(key)
    )

    const isEmpty = remainingKeys.length === 0
    const removeKeys = ['asset']
      .concat(allKeys.filter((key) => ['crop', 'hotspot', '_upload'].includes(key)))
      .map((key) => unset([key]))

    onChange(PatchEvent.from(isEmpty && !isArrayElement ? unset() : removeKeys))*/
  }

  const handleFieldChange = (event: PatchEvent) => {
    onChange(
      event.prepend(
        setIfMissing({
          _type: type.name,
        })
      )
    )
  }

  const getConstrainedImageSrc = (assetDocument: ImageAsset): string => {
    const materializedSize = ImageTool.maxWidth || 1000
    const maxSize = materializedSize * getDevicePixelRatio()
    const constrainedSrc = `${assetDocument.url}?w=${maxSize}&h=${maxSize}&fit=max`
    return constrainedSrc
  }

  const handleAssetSourceClosed = () => {
    setSelectedAssetSource(null)
    setIsBrowsing(false)
  }

  const setSelectAssetFromSource = (assetFromSource: AssetFromSource) => {
    handleSelectAssetFromSource({
      assetFromSource,
      onChange,
      type,
      resolveUploader,
      uploadWith: uploadWith,
      isImage: true,
    })
    setSelectedAssetSource(null)
  }

  /* Render methods */

  const renderBrowser = () => {
    if (assetSources.length === 0) return null

    if (assetSources.length > 1 && !readOnly && directUploads) {
      return (
        <MenuButton
          id={`${_inputId}_assetImageButton`}
          button={<Button mode="ghost" text="Select" icon={SearchIcon} />}
          data-testid="input-select-button"
          menu={
            <Menu>
              {assetSources.map((assetSource) => {
                return (
                  <MenuItem
                    key={assetSource.name}
                    text={assetSource.title}
                    onClick={() => handleSelectImageFromAssetSource(assetSource)}
                    icon={assetSource.icon || ImageIcon}
                  />
                )
              })}
            </Menu>
          }
        />
      )
    }

    return (
      <Button
        fontSize={2}
        text="Browse"
        icon={SearchIcon}
        mode="ghost"
        onClick={() => handleSelectImageFromAssetSource(assetSources[0])}
        data-testid="file-input-select-button"
        disabled={readOnly}
      />
    )
  }

  const renderUploadPlaceholder = () => {
    return (
      <UploadPlaceholder
        readOnly={readOnly}
        browse={renderBrowser()}
        onUpload={handleSelectFiles}
        hoveringFiles={hoveringFiles}
        acceptedFiles={acceptedFiles}
        rejectedFilesCount={rejectedFilesCount}
        type="image"
        accept={accept}
        directUploads={directUploads}
      />
    )
  }

  const renderAsset = () => {
    const showAdvancedEditButton =
      value && (fieldGroups.dialog.length > 0 || (value?.asset && isImageToolEnabled))

    let browseMenuItem: ReactElement<any, any> | ReactElement<any, any>[] =
      assetSources.length === 0 ? null : (
        <MenuItem
          icon={SearchIcon}
          text="Browse"
          onClick={() => handleSelectImageFromAssetSource(assetSources[0])}
          disabled={readOnly}
        />
      )

    if (assetSources.length > 1) {
      browseMenuItem = assetSources.map((assetSource) => {
        return (
          <MenuItem
            key={assetSource.name}
            text={assetSource.title}
            onClick={() => handleSelectImageFromAssetSource(assetSource)}
            icon={assetSource.icon || ImageIcon}
          />
        )
      })
    }

    return (
      <WithMaterializedReference reference={value!.asset} materialize={materialize}>
        {(fileAsset) => {
          return (
            <>
              <ImageActionsMenu onEdit={handleOpenDialog} showEdit={showAdvancedEditButton}>
                <ActionsMenu
                  onUpload={handleSelectFiles}
                  browse={browseMenuItem}
                  onReset={handleRemoveButtonClick}
                  assetDocument={fileAsset}
                  readOnly={readOnly}
                  directUploads={directUploads}
                  accept={accept}
                />
              </ImageActionsMenu>

              <HotspotImageInput
                drag={!value?._upload && hoveringFiles.length > 0}
                assetDocument={fileAsset}
                isRejected={rejectedFilesCount > 0 || !directUploads}
                readOnly={readOnly}
              />
            </>
          )
        }}
      </WithMaterializedReference>
    )
  }

  const renderFields = (fields: ObjectField[]) => {
    return fields.map((field) => (
      <ImageInputField
        key={field.name}
        field={field}
        parentValue={value}
        value={value?.[field.name]}
        onChange={handleFieldChange}
        onFocus={onFocus}
        compareValue={compareValue}
        onBlur={onBlur}
        readOnly={Boolean(readOnly || field.type.readOnly)}
        focusPath={focusPath}
        level={level}
        presence={presence}
        markers={markers.filter((marker) => marker.path[0] === field.name)}
      />
    ))
  }

  const renderDialogFields = (fields: ObjectField[]) => {
    const withImageTool = isImageToolEnabled && value && value.asset

    const imageToolPresence = withImageTool
      ? presence.filter((item) => item.path[0] === 'hotspot')
      : EMPTY_ARRAY

    return (
      <Dialog
        header="Edit details"
        id={`${_inputId}_dialog`}
        onClose={() => onFocus([])}
        width={1}
        __unstable_autoFocus={false}
      >
        <PresenceOverlay>
          <Box padding={4}>
            <Stack space={5}>
              {withImageTool && (
                <WithMaterializedReference materialize={materialize} reference={value?.asset}>
                  {(imageAsset) => (
                    <ImageToolInput
                      type={type}
                      level={level}
                      readOnly={Boolean(readOnly)}
                      imageUrl={getConstrainedImageSrc(imageAsset)}
                      value={value}
                      focusPath={focusPath}
                      presence={imageToolPresence}
                      onFocus={onFocus}
                      compareValue={compareValue}
                      onChange={onChange}
                    />
                  )}
                </WithMaterializedReference>
              )}
              {renderFields(fields)}
            </Stack>
          </Box>
        </PresenceOverlay>
      </Dialog>
    )
  }

  const renderAssetSource = () => {
    if (!selectedAssetSource) {
      return null
    }

    const Component = selectedAssetSource.component
    if (value && value.asset) {
      return (
        <WithMaterializedReference materialize={materialize} reference={value.asset}>
          {(imageAsset) => {
            return (
              <Component
                selectedAssets={[imageAsset as AssetDocument]}
                assetType="image"
                selectionType="single"
                onClose={handleAssetSourceClosed}
                onSelect={setSelectAssetFromSource}
              />
            )
          }}
        </WithMaterializedReference>
      )
    }

    return (
      <Component
        selectedAssets={[]}
        selectionType="single"
        assetType="image"
        onClose={handleAssetSourceClosed}
        onSelect={setSelectAssetFromSource}
      />
    )
  }

  return (
    <>
      <FormFieldSet
        __unstable_markers={markers}
        __unstable_presence={isDialogOpen ? EMPTY_ARRAY : fieldPresence}
        title={type.title}
        description={type.description}
        level={fieldGroups.highlighted.length > 0 ? level : 0}
        __unstable_changeIndicator={false}
      >
        <div>
          {isStale && (
            <Box marginBottom={2}>
              <UploadWarning onClearStale={handleClearState} />
            </Box>
          )}

          <ChangeIndicatorForFieldPath
            path={ASSET_FIELD_PATH}
            hasFocus={focusPath?.[0] === 'asset'}
            isChanged={
              value?.asset?._ref !== compareValue?.asset?._ref ||
              fieldGroups.imageToolAndDialog.some(
                (field) => !deepCompare(value?.[field.name], compareValue?.[field.name])
              )
            }
          >
            {/* not uploading */}
            {!value?._upload && (
              <FileTarget
                tabIndex={readOnly ? undefined : 0}
                disabled={false}
                ref={setFocusElement}
                onFiles={handleSelectFiles}
                onFilesOver={handleFilesOver}
                onFilesOut={handleFilesOut}
                onFocus={handleFileTargetFocus}
                onBlur={handleFileTargetBlur}
                border={!value?.asset}
                padding={value?.asset ? 0 : 5}
                style={{
                  borderStyle: !readOnly && hoveringFiles.length > 0 ? 'solid' : 'dashed',
                }}
                tone={getFileTone()}
              >
                {/* render placeholder */}
                {!value?.asset && renderUploadPlaceholder()}

                {/* render asset preview */}
                {!value?._upload && value?.asset && renderAsset()}
              </FileTarget>
            )}
            {/* uploading */}
            {value?._upload && (
              <UploadProgress
                uploadState={value._upload}
                onCancel={isUploading ? () => cancelUpload() : undefined}
                onStale={() => setIsStale(true)}
              />
            )}
          </ChangeIndicatorForFieldPath>
        </div>

        {/* render highlighted fields*/}
        {renderFields(fieldGroups.highlighted)}
        {isDialogOpen && renderDialogFields(fieldGroups.dialog)}
        {isBrowsing && renderAssetSource()}
      </FormFieldSet>
    </>
  )
}
