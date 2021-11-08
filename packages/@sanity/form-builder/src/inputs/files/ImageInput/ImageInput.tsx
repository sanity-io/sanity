/* eslint-disable import/no-unresolved */

import {FormFieldSet, ImperativeToast} from '@sanity/base/components'
import {
  Box,
  Button,
  Dialog,
  Flex,
  Grid,
  Menu,
  MenuButton,
  MenuItem,
  Stack,
  Text,
  ToastParams,
} from '@sanity/ui'
import {get, groupBy, uniqueId} from 'lodash'
import {Observable, Subscription} from 'rxjs'
import {ChangeIndicatorForFieldPath} from '@sanity/base/change-indicators'
import {EditIcon, EyeOpenIcon, ImageIcon, SearchIcon, TrashIcon, UploadIcon} from '@sanity/icons'
import HotspotImage from '@sanity/imagetool/HotspotImage'
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
import React from 'react'
import PropTypes from 'prop-types'
import {FormFieldPresence, PresenceOverlay} from '@sanity/base/presence'
import deepCompare from 'react-fast-compare'
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
import {FileInputButton} from '../common/FileInputButton/FileInputButton'
import {FileTarget, Overlay} from '../common/styles'
import {InternalAssetSource, UploadState} from '../types'
import {UploadProgress} from '../common/UploadProgress'
import {RatioBox} from '../common/RatioBox'
import {EMPTY_ARRAY} from '../../../utils/empty'
import {DropMessage} from '../common/DropMessage'
import {handleSelectAssetFromSource} from '../common/assetSource'
import {ImageInputField} from './ImageInputField'

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

type ImageInputState = {
  isUploading: boolean
  selectedAssetSource: InternalAssetSource | null
  // Metadata about files currently over the drop area
  hoveringFiles: FileInfo[]
}

type Focusable = {
  focus: () => void
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

export default class ImageInput extends React.PureComponent<Props, ImageInputState> {
  static contextTypes = {
    getValuePath: PropTypes.func,
  }

  _inputId = uniqueId('ImageInput')

  _assetElementRef: null | Focusable = null
  _fieldGroupsMemo: null | FieldGroups = null
  uploadSubscription: null | Subscription = null

  state: ImageInputState = {
    isUploading: false,
    selectedAssetSource: null,
    hoveringFiles: [],
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

  getConstrainedImageSrc = (assetDocument: ImageAsset): string => {
    const materializedSize = ImageTool.maxWidth || 1000
    const maxSize = materializedSize * getDevicePixelRatio()
    const constrainedSrc = `${assetDocument.url}?w=${maxSize}&h=${maxSize}&fit=max`
    return constrainedSrc
  }

  clearUploadStatus() {
    // todo: this is kind of hackish
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
    const {resolveUploader, type} = this.props

    const match = files
      .map((file) => ({file, uploader: resolveUploader(type, file)}))
      .find((result) => result.uploader)

    if (match) {
      this.uploadWith(match.uploader!, match.file)
    }
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
    const {getValuePath} = this.context
    const {value} = this.props
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

    this.props.onChange(PatchEvent.from(isEmpty && !isArrayElement ? unset() : removeKeys))
  }

  handleFieldChange = (event: PatchEvent) => {
    const {onChange, type} = this.props
    onChange(
      event.prepend(
        setIfMissing({
          _type: type.name,
        })
      )
    )
  }

  handleOpenDialog = () => {
    const {type, onFocus} = this.props
    const groups = this.getGroupedFields(type)
    const firstDialogField = this.isImageToolEnabled() ? groups.imagetool[0] : groups.dialog[0]
    if (firstDialogField) {
      onFocus([firstDialogField.name])
    }
  }

  handleCloseDialog = () => {
    this.props.onFocus([])
  }

  handleSelectAssetFromSource = (assetFromSource: AssetFromSource) => {
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
    this.props.onFocus(['asset'])
  }

  handleFileTargetBlur = () => {
    this.props.onBlur()
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
    this.clearUploadStatus()
  }

  handleSelectFiles = (files: File[]) => this.uploadFirstAccepted(files)

  handleSelectImageFromAssetSource = (source: InternalAssetSource) => {
    this.setState({selectedAssetSource: source})
  }

  handleAssetSourceClosed = () => {
    this.setState({selectedAssetSource: null})
  }

  renderDialogFields(fields: ObjectField[]) {
    const {
      value,
      compareValue,
      focusPath,
      onFocus,
      level,
      type,
      onChange,
      readOnly,
      presence,
      materialize,
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
              {withImageTool && (
                <WithMaterializedReference materialize={materialize} reference={value?.asset}>
                  {(imageAsset) => (
                    <ImageToolInput
                      type={type}
                      level={level}
                      readOnly={Boolean(readOnly)}
                      imageUrl={this.getConstrainedImageSrc(imageAsset)}
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
              {this.renderFields(fields)}
            </Stack>
          </Box>
        </PresenceOverlay>
      </Dialog>
    )
  }

  renderMaterializedAsset = (assetDocument: ImageAsset) => {
    const {value = {}} = this.props
    const constrainedSrc = this.getConstrainedImageSrc(assetDocument)
    const srcAspectRatio = get(assetDocument, 'metadata.dimensions.aspectRatio')
    return typeof srcAspectRatio === 'undefined' ? null : (
      <HotspotImage
        aspectRatio="auto"
        src={constrainedSrc}
        srcAspectRatio={srcAspectRatio}
        hotspot={value.hotspot}
        crop={value.crop}
      />
    )
  }

  renderFields(fields: ObjectField[]) {
    return fields.map((field) => this.renderField(field))
  }

  renderField(field: ObjectField) {
    const {
      value,
      level,
      focusPath,
      onFocus,
      readOnly,
      onBlur,
      compareValue,
      presence,
      markers,
    } = this.props
    const fieldValue = value?.[field.name]
    const fieldMarkers = markers.filter((marker) => marker.path[0] === field.name)

    return (
      <ImageInputField
        key={field.name}
        field={field}
        parentValue={value}
        value={fieldValue}
        onChange={this.handleFieldChange}
        onFocus={onFocus}
        compareValue={compareValue}
        onBlur={onBlur}
        readOnly={Boolean(readOnly || field.type.readOnly)}
        focusPath={focusPath}
        level={level}
        presence={presence}
        markers={fieldMarkers}
      />
    )
  }

  renderAsset() {
    const {value, materialize} = this.props
    return (
      <WithMaterializedReference reference={value!.asset} materialize={materialize}>
        {this.renderMaterializedAsset}
      </WithMaterializedReference>
    )
  }

  renderUploadPlaceholder() {
    const {readOnly} = this.props
    return readOnly ? (
      <Text align="center" muted>
        This field is read-only
      </Text>
    ) : (
      <UploadPlaceholder fileType="image" />
    )
  }

  renderUploadState(uploadState: UploadState) {
    const {isUploading} = this.state

    return (
      <UploadProgress
        uploadState={uploadState}
        onCancel={isUploading ? this.handleCancelUpload : undefined}
        onClearStale={this.handleClearUploadState}
      />
    )
  }

  renderSelectImageButton() {
    const {assetSources} = this.props
    if (!assetSources?.length) {
      return null
    }
    // If multiple asset sources render a dropdown
    if (assetSources.length > 1) {
      return (
        <MenuButton
          id={`${this._inputId}_assetImageButton`}
          button={<Button mode="ghost" text="Select…" icon={SearchIcon} />}
          data-testid="image-input-select-button"
          menu={
            <Menu>
              {assetSources.map((assetSource) => {
                return (
                  <MenuItem
                    key={assetSource.name}
                    text={assetSource.title}
                    onClick={() => this.handleSelectImageFromAssetSource(assetSource)}
                    icon={assetSource.icon || ImageIcon}
                  />
                )
              })}
            </Menu>
          }
        />
      )
    }

    // Single asset source (just a normal button)
    return (
      <Button
        icon={SearchIcon}
        onClick={() => this.handleSelectImageFromAssetSource(assetSources[0])}
        mode="ghost"
        text="Select"
        data-testid="image-input-select-button"
      />
    )
  }

  renderAssetSource() {
    const {selectedAssetSource} = this.state
    const {value, materialize} = this.props
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
                onClose={this.handleAssetSourceClosed}
                onSelect={this.handleSelectAssetFromSource}
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
        return (field.type as any)?.options?.isHighlighted ? 'highlighted' : 'dialog'
      })

      this._fieldGroupsMemo = {
        ...EMPTY_FIELD_GROUPS,
        ...fieldGroups,
        imageToolAndDialog: [...(fieldGroups.imagetool || []), ...(fieldGroups.dialog || [])],
      }
    }
    return this._fieldGroupsMemo
  }

  componentDidUpdate(prevProps: Props) {
    const {focusPath: prevFocusPath = []} = prevProps
    const {focusPath: currentFocusPath = []} = this.props
    if (prevFocusPath[0] !== 'asset' && currentFocusPath[0] === 'asset') {
      this._assetElementRef?.focus()
    }
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
      markers,
      readOnly,
      presence,
      focusPath = EMPTY_ARRAY,
      directUploads,
      resolveUploader,
    } = this.props
    const {hoveringFiles, selectedAssetSource} = this.state

    const accept = get(type, 'options.accept', 'image/*')

    const fieldGroups = this.getGroupedFields(type)

    // Get presence items for people who are either at the asset field, or at fields shown behind the dialog
    const fieldPresence = presence.filter(
      (item) =>
        item.path[0] === 'asset' ||
        fieldGroups.imageToolAndDialog.some((field) => item.path[0] === field.name)
    )
    const showAdvancedEditButton =
      value && (fieldGroups.dialog.length > 0 || (value?.asset && this.isImageToolEnabled()))

    const isDialogOpen =
      focusPath.length > 0 &&
      fieldGroups.dialog.concat(fieldGroups.imagetool).some((field) => focusPath[0] === field.name)

    return (
      <>
        <ImperativeToast ref={this.setToast} />

        <FormFieldSet
          __unstable_markers={markers}
          __unstable_presence={isDialogOpen ? EMPTY_ARRAY : fieldPresence}
          title={type.title}
          description={type.description}
          level={fieldGroups.highlighted.length > 0 ? level : 0}
          __unstable_changeIndicator={false}
          readOnly={Boolean(readOnly)}
        >
          <div>
            <ChangeIndicatorForFieldPath
              path={ASSET_FIELD_PATH}
              hasFocus={this.hasFileTargetFocus()}
              isChanged={
                value?.asset?._ref !== compareValue?.asset?._ref ||
                this.hasChangeInFields(fieldGroups.imageToolAndDialog)
              }
            >
              <FileTarget
                tabIndex={readOnly ? undefined : 0}
                shadow={1}
                disabled={readOnly === true}
                ref={this.setFocusElement}
                onFiles={this.handleSelectFiles}
                onFilesOver={this.handleFilesOver}
                onFilesOut={this.handleFilesOut}
                onFocus={this.handleFileTargetFocus}
                onBlur={this.handleFileTargetBlur}
                tone="transparent"
              >
                <RatioBox ratio={3 / 2} padding={1}>
                  <Flex align="center" justify="center">
                    {value?._upload && this.renderUploadState(value._upload)}
                    {!value?._upload && value?.asset && this.renderAsset()}
                    {!value?._upload && !value?.asset && this.renderUploadPlaceholder()}
                    {!value?._upload && !readOnly && hoveringFiles.length > 0 && (
                      <Overlay>
                        <DropMessage
                          hoveringFiles={hoveringFiles}
                          resolveUploader={resolveUploader}
                          types={[type]}
                        />
                      </Overlay>
                    )}
                  </Flex>
                </RatioBox>
              </FileTarget>
            </ChangeIndicatorForFieldPath>
            <Grid
              gap={1}
              marginTop={3}
              style={{gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))'}}
            >
              {!readOnly && directUploads && (
                <FileInputButton
                  icon={UploadIcon}
                  mode="ghost"
                  onSelect={this.handleSelectFiles}
                  accept={accept}
                  text="Upload"
                  data-testid="image-input-upload-button"
                />
              )}

              {!readOnly && this.renderSelectImageButton()}

              {showAdvancedEditButton && (
                <Button
                  icon={readOnly ? EyeOpenIcon : EditIcon}
                  mode="ghost"
                  onClick={this.handleOpenDialog}
                  text={readOnly ? 'View details' : 'Edit details'}
                />
              )}

              {value?.asset && !readOnly && (
                <Button
                  tone="critical"
                  mode="ghost"
                  icon={TrashIcon}
                  onClick={this.handleRemoveButtonClick}
                  text="Remove"
                  data-testid="image-input-remove-button"
                />
              )}
            </Grid>
          </div>

          {this.renderFields(fieldGroups.highlighted)}
          {isDialogOpen && this.renderDialogFields(fieldGroups.dialog)}
          {selectedAssetSource && this.renderAssetSource()}
        </FormFieldSet>
      </>
    )
  }
}
