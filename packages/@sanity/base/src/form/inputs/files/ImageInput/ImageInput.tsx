/* eslint-disable import/no-unresolved */

import {Box, Button, Card, Dialog, Menu, MenuButton, MenuItem, Stack, ToastParams} from '@sanity/ui'
import {get, groupBy, uniqueId} from 'lodash'
import {Observable, Subscription} from 'rxjs'
import {ChevronDownIcon, ImageIcon, SearchIcon} from '@sanity/icons'
import {
  ImageAsset,
  AssetFromSource,
  Image as BaseImage,
  ImageSchemaType,
  ObjectField,
  Path,
} from '@sanity/types'
import React, {ReactNode} from 'react'
import deepCompare from 'react-fast-compare'
import {PatchEvent, setIfMissing, unset} from '../../../patch'
import {FIXME, ObjectInputProps} from '../../../types'
import {PresenceOverlay} from '../../../../presence'
import {ChangeIndicatorForFieldPath} from '../../../../components/changeIndicators'
import {FormFieldSet} from '../../../../components/formField'
import {ImperativeToast} from '../../../../components/transitional'
import {
  UploaderResolver,
  ResolvedUploader,
  Uploader,
  UploadOptions,
} from '../../../studio/uploads/types'
import {ImageToolInput} from '../ImageToolInput'
import {UploadPlaceholder} from '../common/UploadPlaceholder'
import {WithReferencedAsset} from '../../../utils/WithReferencedAsset'
import {FileTarget} from '../common/styles'
import {ImageUrlBuilder, InternalAssetSource, UploadState} from '../types'
import {UploadProgress} from '../common/UploadProgress'
import {EMPTY_ARRAY} from '../../../utils/empty'
import {handleSelectAssetFromSource} from '../common/assetSource'
import {ActionsMenu} from '../common/ActionsMenu'
import {UploadWarning} from '../common/UploadWarning'
import {ImagePreview} from './ImagePreview'
import {ImageActionsMenu} from './ImageActionsMenu'

export interface Image extends Partial<BaseImage> {
  _upload?: UploadState
}

export interface ImageInputProps extends ObjectInputProps<Image, ImageSchemaType> {
  assetSources: InternalAssetSource[]
  directUploads?: boolean
  getValuePath: () => Path
  imageUrlBuilder: ImageUrlBuilder
  observeAsset: (documentId: string) => Observable<ImageAsset>
  resolveUploader: UploaderResolver
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

type ImageInputState = {
  isUploading: boolean
  selectedAssetSource: InternalAssetSource | null
  // Metadata about files currently over the drop area
  hoveringFiles: FileInfo[]
  isStale: boolean
  isMenuOpen: boolean
}

type Focusable = {
  focus: () => void
  offsetHeight: number
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

export class ImageInput extends React.PureComponent<ImageInputProps, ImageInputState> {
  _inputId = uniqueId('ImageInput')

  _assetElementRef: null | Focusable = null
  _fieldGroupsMemo: null | FieldGroups = null
  uploadSubscription: null | Subscription = null

  state: ImageInputState = {
    isUploading: false,
    selectedAssetSource: null,
    hoveringFiles: [],
    isStale: false,
    isMenuOpen: false,
  }

  toast: {push: (params: ToastParams) => void} | null = null

  focus() {
    if (this._assetElementRef) {
      this._assetElementRef.focus()
    }
  }

  setFocusElement = (el: HTMLElement | null) => {
    this._assetElementRef = el
  }

  isImageToolEnabled() {
    return get(this.props.type, 'options.hotspot') === true
  }

  clearUploadStatus() {
    if (this.props.value?._upload) {
      this.props.onChange(PatchEvent.from([unset(['_upload'])]))
    }
  }

  cancelUpload() {
    if (this.uploadSubscription) {
      this.uploadSubscription.unsubscribe()
      this.clearUploadStatus()
    }
  }

  getUploadOptions = (file: File): ResolvedUploader[] => {
    const {type, resolveUploader} = this.props
    const uploader = resolveUploader && resolveUploader(type, file)
    return uploader ? [{type: type, uploader}] : []
  }

  uploadFirstAccepted(files: File[]) {
    const {type, resolveUploader} = this.props

    const match = files
      .map((file) => ({file, uploader: resolveUploader(type, file)}))
      .find((result) => result.uploader)

    if (match) {
      this.uploadWith(match.uploader!, match.file)
    }

    this.setState({isMenuOpen: false})
  }

  uploadWith = (uploader: Uploader, file: File, assetDocumentProps: UploadOptions = {}) => {
    const {type, onChange} = this.props
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

    this.cancelUpload()
    this.setState({isUploading: true})
    onChange(PatchEvent.from([setIfMissing({_type: type.name})]))
    this.uploadSubscription = uploader.upload(file, type, options).subscribe({
      next: (uploadEvent) => {
        if (uploadEvent.patches) {
          onChange(PatchEvent.from(uploadEvent.patches))
        }
      },
      error: (err) => {
        // eslint-disable-next-line no-console
        console.error(err)
        this.toast?.push({
          status: 'error',
          description: 'The upload could not be completed at this time.',
          title: 'Upload failed',
        })

        this.clearUploadStatus()
      },
      complete: () => {
        onChange(PatchEvent.from([unset(['hotspot']), unset(['crop'])]))
        this.setState({isUploading: false})
        // this.toast.push({
        //   status: 'success',
        //   title: 'Upload completed',
        // })
      },
    })
  }

  handleRemoveButtonClick = () => {
    const {value} = this.props

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

    this.props.onChange(
      PatchEvent.from(isEmpty && !this.valueIsArrayElement() ? unset() : removeKeys)
    )
  }

  handleFieldChange = (event: PatchEvent) => {
    const {onChange, type} = this.props

    // When editing a metadata field for an image (eg `altText`), and no asset
    // is currently selected, we want to unset the entire image field if the
    // field we are currently editing goes blank and gets unset.
    //
    // For instance:
    // An image field with an `altText` and a `title` subfield, where the image
    // `asset` and the `title` field is empty, and we are erasing the `alt` field.
    // We do _not_ however want to clear the field if any content is present in
    // the other fields - but we do not consider `crop` and `hotspot`.
    //
    // Also, we don't want to use this logic for array items, since the parent will
    // take care of it when closing the array dialog
    if (!this.valueIsArrayElement() && this.eventIsUnsettingLastFilledField(event)) {
      onChange(PatchEvent.from(unset()))
      return
    }

    onChange(
      event.prepend(
        setIfMissing({
          _type: type.name,
        })
      )
    )
  }

  eventIsUnsettingLastFilledField = (event: PatchEvent): boolean => {
    const patch = event.patches[0]
    if (event.patches.length !== 1 || patch.type !== 'unset') {
      return false
    }

    const allKeys = Object.keys(this.props.value || {})
    const remainingKeys = allKeys.filter(
      (key) => !['_type', '_key', 'crop', 'hotspot'].includes(key)
    )

    const isEmpty =
      event.patches[0].path.length === 1 &&
      remainingKeys.length === 1 &&
      remainingKeys[0] === event.patches[0].path[0]

    return isEmpty
  }

  valueIsArrayElement = () => {
    const {getValuePath} = this.props
    const parentPathSegment = getValuePath().slice(-1)[0]

    // String path segment mean an object path, while a number or a
    // keyed segment means we're a direct child of an array
    return typeof parentPathSegment !== 'string'
  }

  handleOpenDialog = () => {
    const {inputProps, type} = this.props
    const groups = this.getGroupedFields(type)
    const firstDialogField = this.isImageToolEnabled() ? groups.imagetool[0] : groups.dialog[0]
    if (firstDialogField) {
      inputProps.onFocus([firstDialogField.name])
    }
  }

  handleCloseDialog = () => {
    const {inputProps} = this.props
    inputProps.onFocus([])
  }

  handleSelectAssetFromSource = (assetFromSource: AssetFromSource[]) => {
    const {onChange, type, resolveUploader} = this.props
    handleSelectAssetFromSource({
      assetFromSource,
      onChange,
      type,
      resolveUploader,
      uploadWith: this.uploadWith,
      isImage: true,
    })

    this.setState({selectedAssetSource: null})
  }

  hasFileTargetFocus() {
    return this.props.focusPath?.[0] === 'asset'
  }

  handleFileTargetFocus = () => {
    const {inputProps} = this.props
    inputProps.onFocus(['asset'])
  }

  handleFileTargetBlur = () => {
    const {inputProps} = this.props
    inputProps.onBlur?.()
  }

  handleFilesOver = (hoveringFiles: FileInfo[]) => {
    this.setState({
      hoveringFiles,
    })
  }
  handleFilesOut = () => {
    this.setState({
      hoveringFiles: [],
    })
  }

  handleCancelUpload = () => {
    this.cancelUpload()
  }

  handleClearUploadState = () => {
    this.setState({isStale: false})
    this.clearUploadStatus()
  }

  handleStaleUpload = () => {
    this.setState({isStale: true})
  }

  handleSelectFiles = (files: File[]) => {
    const {directUploads, inputProps} = this.props
    const {hoveringFiles} = this.state

    if (directUploads && !inputProps.readOnly) {
      this.uploadFirstAccepted(files)
    } else if (hoveringFiles.length > 0) {
      this.handleFilesOut()
    }
  }

  handleSelectImageFromAssetSource = (source: InternalAssetSource) => {
    this.setState({selectedAssetSource: source})
  }

  handleAssetSourceClosed = () => {
    this.setState({selectedAssetSource: null})
  }

  renderDialogFields(fields: ObjectField[]) {
    const {
      inputProps,
      value,
      // compareValue,
      // focusPath,
      // onFocus,
      // level,
      // type,
      // onChange,
      // readOnly,
      presence,
      // imageUrlBuilder,
      // validation,
    } = this.props

    const withImageTool = this.isImageToolEnabled() && value && value.asset

    const imageToolPresence = withImageTool
      ? presence.filter((item) => item.path[0] === 'hotspot')
      : EMPTY_ARRAY

    return (
      <Dialog
        header="Edit details"
        id={`${this._inputId}_dialog`}
        onClose={this.handleCloseDialog}
        width={1}
        __unstable_autoFocus={false}
      >
        <PresenceOverlay>
          <Box padding={4}>
            <Stack space={5}>
              {withImageTool && value?.asset && (
                <>TODO</>
                // <ImageToolInput
                //   type={type}
                //   level={level}
                //   readOnly={Boolean(readOnly)}
                //   imageUrl={imageUrlBuilder.image(value.asset).url()}
                //   value={value as FIXME}
                //   focusPath={focusPath}
                //   presence={imageToolPresence}
                //   onFocus={onFocus}
                //   compareValue={compareValue as FIXME}
                //   onChange={onChange}
                //   validation={validation}
                // />
              )}

              {this.renderFields(fields)}
            </Stack>
          </Box>
        </PresenceOverlay>
      </Dialog>
    )
  }

  renderPreview = () => {
    const {inputProps, value, type, directUploads, imageUrlBuilder, resolveUploader} = this.props

    if (!value) {
      return null
    }

    const {hoveringFiles} = this.state

    const acceptedFiles = hoveringFiles.filter((file) => resolveUploader(type, file))
    const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length

    return (
      <ImagePreview
        drag={!value?._upload && hoveringFiles.length > 0}
        isRejected={rejectedFilesCount > 0 || !directUploads}
        readOnly={inputProps.readOnly}
        src={imageUrlBuilder
          .width(2000)
          .fit('max')
          .image(value)
          .dpr(getDevicePixelRatio())
          .auto('format')
          .url()}
        alt="Preview of uploaded image"
      />
    )
  }

  renderFields(fields: ObjectField[]) {
    return fields.map((field) => this.renderField(field))
  }

  renderField(field: ObjectField) {
    const {value, level, focusPath, inputProps, compareValue, presence, validation} = this.props
    const {onFocus, readOnly, onBlur} = inputProps
    const fieldValue = value?.[field.name]
    const fieldMarkers = validation.filter((marker) => marker.path[0] === field.name)

    return (
      <>TODO</>
      // <ImageInputField
      //   key={field.name}
      //   field={field}
      //   parentValue={value}
      //   value={fieldValue}
      //   onChange={this.handleFieldChange}
      //   onFocus={onFocus}
      //   compareValue={compareValue}
      //   onBlur={onBlur}
      //   readOnly={Boolean(readOnly || field.type.readOnly)}
      //   focusPath={focusPath}
      //   level={level}
      //   presence={presence}
      //   validation={fieldMarkers}
      // />
    )
  }

  renderAssetMenu() {
    const {value, assetSources, inputProps, type, directUploads, imageUrlBuilder, observeAsset} =
      this.props
    const {readOnly} = inputProps
    const {isMenuOpen} = this.state

    const asset = value?.asset
    if (!asset) {
      return null
    }

    const accept = get(type, 'options.accept', 'image/*')

    const fieldGroups = this.getGroupedFields(type)
    const showAdvancedEditButton =
      value && (fieldGroups.dialog.length > 0 || (asset && this.isImageToolEnabled()))

    let browseMenuItem: ReactNode =
      assetSources && assetSources.length === 0 ? null : (
        <MenuItem
          icon={SearchIcon}
          text="Select"
          onClick={() => {
            this.setState({isMenuOpen: false})
            this.handleSelectImageFromAssetSource(assetSources[0])
          }}
          disabled={readOnly}
          data-testid="file-input-browse-button"
        />
      )

    if (assetSources && assetSources.length > 1) {
      browseMenuItem = assetSources.map((assetSource) => {
        return (
          <MenuItem
            key={assetSource.name}
            text={assetSource.title}
            onClick={() => {
              this.setState({isMenuOpen: false})
              this.handleSelectImageFromAssetSource(assetSource)
            }}
            icon={assetSource.icon || ImageIcon}
            data-testid={`file-input-browse-button-${assetSource.name}`}
            disabled={readOnly}
          />
        )
      })
    }

    return (
      <WithReferencedAsset observeAsset={observeAsset} reference={asset}>
        {(assetDocument) => (
          <ImageActionsMenu
            isMenuOpen={isMenuOpen}
            onEdit={this.handleOpenDialog}
            showEdit={showAdvancedEditButton}
            onMenuOpen={(isOpen) => this.setState({isMenuOpen: isOpen})}
          >
            <ActionsMenu
              onUpload={this.handleSelectFiles}
              browse={browseMenuItem}
              onReset={this.handleRemoveButtonClick}
              downloadUrl={imageUrlBuilder
                .image(value.asset!)
                .forceDownload(
                  assetDocument.originalFilename || `download.${assetDocument.extension}`
                )
                .url()}
              copyUrl={imageUrlBuilder.image(value.asset!).url()}
              readOnly={readOnly}
              directUploads={directUploads}
              accept={accept}
            />
          </ImageActionsMenu>
        )}
      </WithReferencedAsset>
    )
  }

  renderBrowser() {
    const {assetSources, inputProps, directUploads} = this.props
    const {readOnly} = inputProps

    if (assetSources && assetSources.length === 0) return null

    if (assetSources && assetSources.length > 1 && !readOnly && directUploads) {
      return (
        <MenuButton
          id={`${this._inputId}_assetImageButton`}
          button={
            <Button
              mode="ghost"
              text="Select"
              data-testid="file-input-multi-browse-button"
              icon={SearchIcon}
              iconRight={ChevronDownIcon}
            />
          }
          menu={
            <Menu>
              {assetSources.map((assetSource) => {
                return (
                  <MenuItem
                    key={assetSource.name}
                    text={assetSource.title}
                    onClick={() => {
                      this.setState({isMenuOpen: false})
                      this.handleSelectImageFromAssetSource(assetSource)
                    }}
                    icon={assetSource.icon || ImageIcon}
                    disabled={readOnly}
                    data-testid={`file-input-browse-button-${assetSource.name}`}
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
        text="Select"
        icon={SearchIcon}
        mode="ghost"
        onClick={() => {
          this.setState({isMenuOpen: false})
          this.handleSelectImageFromAssetSource(assetSources[0])
        }}
        data-testid="file-input-browse-button"
        disabled={readOnly}
      />
    )
  }

  renderUploadPlaceholder() {
    const {inputProps, type, directUploads, resolveUploader} = this.props
    const {readOnly} = inputProps
    const {hoveringFiles} = this.state

    const acceptedFiles = hoveringFiles.filter((file) => resolveUploader(type, file))
    const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length

    const accept = get(type, 'options.accept', 'image/*')

    return (
      <div style={{padding: 1}}>
        <Card
          tone={readOnly ? 'transparent' : 'inherit'}
          border
          padding={3}
          style={
            hoveringFiles.length === 0
              ? {borderStyle: 'dashed'}
              : {borderStyle: 'dashed', borderColor: 'transparent'}
          }
        >
          <UploadPlaceholder
            browse={this.renderBrowser()}
            onUpload={this.handleSelectFiles}
            readOnly={readOnly}
            hoveringFiles={hoveringFiles}
            acceptedFiles={acceptedFiles}
            rejectedFilesCount={rejectedFilesCount}
            type="image"
            accept={accept}
            directUploads={directUploads}
          />
        </Card>
      </div>
    )
  }

  renderUploadState(uploadState: UploadState) {
    const {isUploading} = this.state
    const elementHeight = this._assetElementRef?.offsetHeight
    const height = elementHeight === 0 ? undefined : elementHeight

    return (
      <UploadProgress
        uploadState={uploadState}
        onCancel={isUploading ? this.handleCancelUpload : undefined}
        onStale={this.handleStaleUpload}
        height={height}
      />
    )
  }

  renderAssetSource() {
    const {selectedAssetSource} = this.state
    const {value, observeAsset} = this.props
    if (!selectedAssetSource) {
      return null
    }
    const Component = selectedAssetSource.component
    if (value && value.asset) {
      return (
        <WithReferencedAsset observeAsset={observeAsset} reference={value.asset}>
          {(imageAsset) => (
            <Component
              selectedAssets={[imageAsset]}
              assetType="image"
              selectionType="single"
              onClose={this.handleAssetSourceClosed}
              onSelect={this.handleSelectAssetFromSource}
            />
          )}
        </WithReferencedAsset>
      )
    }
    return (
      <Component
        selectedAssets={[]}
        selectionType="single"
        assetType="image"
        onClose={this.handleAssetSourceClosed}
        onSelect={this.handleSelectAssetFromSource}
      />
    )
  }

  setToast = (toast: {push: (params: ToastParams) => void}) => {
    this.toast = toast
  }

  getGroupedFields(type: ImageSchemaType): FieldGroups {
    if (!this._fieldGroupsMemo) {
      const fieldGroups = groupBy(type.fields, (field) => {
        if (field.name === 'asset') {
          return 'asset'
        }
        if (field.name === 'hotspot' || field.name === 'crop') {
          return 'imagetool'
        }
        return (field.type as FIXME)?.options?.isHighlighted ? 'highlighted' : 'dialog'
      })

      this._fieldGroupsMemo = {
        ...EMPTY_FIELD_GROUPS,
        ...fieldGroups,
        imageToolAndDialog: [...(fieldGroups.imagetool || []), ...(fieldGroups.dialog || [])],
      }
    }
    return this._fieldGroupsMemo
  }

  componentDidUpdate(prevProps: ImageInputProps) {
    const {focusPath: prevFocusPath = []} = prevProps
    const {focusPath: currentFocusPath = []} = this.props
    if (prevFocusPath[0] !== 'asset' && currentFocusPath[0] === 'asset') {
      this._assetElementRef?.focus()
    }
  }

  componentWillUnmount() {
    const {getValuePath} = this.props
    const pathId = getValuePath()

    window.localStorage.removeItem(`imageHeight_${pathId}`)
  }

  hasChangeInFields(fields: ObjectField[]) {
    const {value, compareValue} = this.props

    return fields.some((field) => !deepCompare(value?.[field.name], compareValue?.[field.name]))
  }

  render() {
    const {
      type,
      value,
      compareValue,
      level,
      validation,
      inputProps,
      presence,
      focusPath = EMPTY_ARRAY,
      directUploads,
      resolveUploader,
    } = this.props
    const {readOnly} = inputProps
    const {hoveringFiles, selectedAssetSource, isStale} = this.state

    const fieldGroups = this.getGroupedFields(type)

    // Get presence items for people who are either at the asset field, or at fields shown behind the dialog
    const fieldPresence = presence.filter(
      (item) =>
        item.path[0] === 'asset' ||
        fieldGroups.imageToolAndDialog.some((field) => item.path[0] === field.name)
    )

    const isDialogOpen =
      focusPath.length > 0 &&
      fieldGroups.dialog.concat(fieldGroups.imagetool).some((field) => focusPath[0] === field.name)

    function getFileTone() {
      const acceptedFiles = hoveringFiles.filter((file) => resolveUploader(type, file))
      const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length

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
    const hasValueOrUpload = Boolean(value?._upload || value?.asset)

    return (
      <>
        <ImperativeToast ref={this.setToast} />

        <FormFieldSet
          __unstable_changeIndicator={false}
          __unstable_presence={isDialogOpen ? EMPTY_ARRAY : fieldPresence}
          description={type.description}
          level={fieldGroups.highlighted.length > 0 ? level : 0}
          onSetCollapsed={() => console.warn('todo')}
          title={type.title}
          validation={validation}
        >
          <div>
            {isStale && (
              <Box marginBottom={2}>
                <UploadWarning onClearStale={this.handleClearUploadState} />
              </Box>
            )}

            <ChangeIndicatorForFieldPath
              path={ASSET_FIELD_PATH}
              hasFocus={this.hasFileTargetFocus()}
              isChanged={
                value?.asset?._ref !== compareValue?.asset?._ref ||
                this.hasChangeInFields(fieldGroups.imageToolAndDialog)
              }
            >
              {/* not uploading */}
              {!value?._upload && (
                <FileTarget
                  tabIndex={0}
                  disabled={Boolean(readOnly)}
                  ref={this.setFocusElement}
                  onFiles={this.handleSelectFiles}
                  onFilesOver={this.handleFilesOver}
                  onFilesOut={this.handleFilesOut}
                  onFocus={this.handleFileTargetFocus}
                  onBlur={this.handleFileTargetBlur}
                  tone={getFileTone()}
                  $border={hasValueOrUpload || hoveringFiles.length > 0}
                  style={{padding: 1}}
                  sizing="border"
                  radius={2}
                >
                  {!value?.asset && this.renderUploadPlaceholder()}
                  {!value?._upload && value?.asset && (
                    <>
                      {this.renderAssetMenu()}
                      {this.renderPreview()}
                    </>
                  )}
                </FileTarget>
              )}

              {/* uploading */}
              {value?._upload && this.renderUploadState(value._upload)}
            </ChangeIndicatorForFieldPath>
          </div>

          {this.renderFields(fieldGroups.highlighted)}
          {isDialogOpen && this.renderDialogFields(fieldGroups.dialog)}
          {selectedAssetSource && this.renderAssetSource()}
        </FormFieldSet>
      </>
    )
  }
}
