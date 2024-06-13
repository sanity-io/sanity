/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/no-this-in-sfc */
/* eslint-disable react/display-name */
/* eslint-disable react/jsx-handler-names */
import {isImageSource} from '@sanity/asset-utils'
import {type AssetFromSource, type AssetSource, type Path, type UploadState} from '@sanity/types'
import {Stack, type ToastParams} from '@sanity/ui'
import {get} from 'lodash'
import {type FocusEvent, PureComponent, type ReactNode} from 'react'
import {type Subscription} from 'rxjs'

import {ImperativeToast} from '../../../../components'
import {FormInput} from '../../../components'
import {MemberField, MemberFieldError, MemberFieldSet} from '../../../members'
import {type PatchEvent, setIfMissing, unset} from '../../../patch'
import {type FieldMember} from '../../../store'
import {
  type ResolvedUploader,
  type Uploader,
  type UploadOptions,
} from '../../../studio/uploads/types'
import {type InputProps} from '../../../types'
import {handleSelectAssetFromSource as _handleSelectAssetFromSource} from '../common/assetSource'
import {UploadProgress} from '../common/UploadProgress'
import {ASSET_FIELD_PATH} from './constants'
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

interface BaseImageInputState {
  isUploading: boolean
  selectedAssetSource: AssetSource | null
  // Metadata about files currently over the drop area
  hoveringFiles: FileInfo[]
  isStale: boolean
  hotspotButtonElement: HTMLButtonElement | null
  menuButtonElement: HTMLButtonElement | null
  isMenuOpen: boolean
}

function passThrough({children}: {children?: ReactNode}) {
  return children
}

/** @internal */
export class BaseImageInput extends PureComponent<BaseImageInputProps, BaseImageInputState> {
  _previewElement: HTMLDivElement | null = null
  _assetPath: Path
  uploadSubscription: null | Subscription = null

  state: BaseImageInputState = {
    isUploading: false,
    selectedAssetSource: null,
    hoveringFiles: [],
    isStale: false,
    hotspotButtonElement: null,
    menuButtonElement: null,
    isMenuOpen: false,
  }

  constructor(props: BaseImageInputProps) {
    super(props)
    this._assetPath = props.path.concat(ASSET_FIELD_PATH)
  }

  toast: {push: (params: ToastParams) => void} | null = null

  setPreviewElement = (el: HTMLDivElement | null) => {
    this._previewElement = el
  }

  setHotspotButtonElement = (el: HTMLButtonElement | null) => {
    this.setState({hotspotButtonElement: el})
  }

  // Get the menu button element in `ImageActionsMenu` so that focus can be restored to
  // it when closing the dialog (see `handleAssetSourceClosed`)
  setMenuButtonElement = (el: HTMLButtonElement | null) => {
    this.setState({menuButtonElement: el})
  }

  isImageToolEnabled() {
    return get(this.props.schemaType, 'options.hotspot') === true
  }

  clearUploadStatus() {
    if (this.props.value?._upload) {
      this.props.onChange(unset(['_upload']))
    }
  }

  cancelUpload() {
    if (this.uploadSubscription) {
      this.uploadSubscription.unsubscribe()
      this.clearUploadStatus()
    }
  }

  getUploadOptions = (file: File): ResolvedUploader[] => {
    const {schemaType, resolveUploader} = this.props
    const uploader = resolveUploader && resolveUploader(schemaType, file)
    return uploader ? [{type: schemaType, uploader}] : []
  }

  uploadFirstAccepted(files: File[]) {
    const {schemaType, resolveUploader} = this.props

    const match = files
      .map((file) => ({file, uploader: resolveUploader(schemaType, file)}))
      .find((result) => result.uploader)

    if (match) {
      this.uploadWith(match.uploader!, match.file)
    }

    this.setState({isMenuOpen: false})
  }

  uploadWith = (uploader: Uploader, file: File, assetDocumentProps: UploadOptions = {}) => {
    const {schemaType, onChange, client, t} = this.props
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

    this.cancelUpload()
    this.setState({isUploading: true})
    onChange(setIfMissing({_type: schemaType.name}))
    this.uploadSubscription = uploader.upload(client, file, schemaType, options).subscribe({
      next: (uploadEvent) => {
        if (uploadEvent.patches) {
          onChange(uploadEvent.patches)
        }
      },
      error: (err) => {
        // eslint-disable-next-line no-console
        console.error(err)
        this.toast?.push({
          status: 'error',
          description: t('inputs.image.upload-error.description'),
          title: t('inputs.image.upload-error.title'),
        })

        this.clearUploadStatus()
      },
      complete: () => {
        onChange([unset(['hotspot']), unset(['crop'])])
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
      (key) => !['_type', '_key', '_upload', 'asset', 'crop', 'hotspot'].includes(key),
    )

    const isEmpty = remainingKeys.length === 0
    const removeKeys = ['asset']
      .concat(allKeys.filter((key) => ['crop', 'hotspot', '_upload'].includes(key)))
      .map((key) => unset([key]))

    this.props.onChange(isEmpty && !this.valueIsArrayElement() ? unset() : removeKeys)
  }

  handleFieldChange = (event: PatchEvent) => {
    const {onChange, schemaType} = this.props

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
      onChange(unset())
      return
    }

    onChange(
      event.prepend(
        setIfMissing({
          _type: schemaType.name,
        }),
      ).patches,
    )
  }

  eventIsUnsettingLastFilledField = (event: PatchEvent): boolean => {
    const patch = event.patches[0]
    if (event.patches.length !== 1 || patch.type !== 'unset') {
      return false
    }

    const allKeys = Object.keys(this.props.value || {})
    const remainingKeys = allKeys.filter(
      (key) => !['_type', '_key', 'crop', 'hotspot'].includes(key),
    )

    const isEmpty =
      event.patches[0].path.length === 1 &&
      remainingKeys.length === 1 &&
      remainingKeys[0] === event.patches[0].path[0]

    return isEmpty
  }

  valueIsArrayElement = () => {
    const {path} = this.props
    const parentPathSegment = path.slice(-1)[0]

    // String path segment mean an object path, while a number or a
    // keyed segment means we're a direct child of an array
    return typeof parentPathSegment !== 'string'
  }

  handleOpenDialog = () => {
    this.props.onPathFocus(['hotspot'])
  }

  handleCloseDialog = () => {
    this.props.onPathFocus([])

    // Set focus on hotspot button in `ImageActionsMenu` when closing the dialog
    this.state.hotspotButtonElement?.focus()
  }

  handleSelectAssetFromSource = (assetFromSource: AssetFromSource[]) => {
    const {onChange, schemaType, resolveUploader} = this.props
    _handleSelectAssetFromSource({
      assetFromSource,
      onChange,
      type: schemaType,
      resolveUploader,
      uploadWith: this.uploadWith,
      isImage: true,
    })

    this.setState({selectedAssetSource: null})
  }

  handleFileTargetFocus = (event: FocusEvent) => {
    // We want to handle focus when the file target element *itself* receives
    // focus, not when an interactive child element receives focus. Since React has decided
    // to let focus bubble, so this workaround is needed
    // Background: https://github.com/facebook/react/issues/6410#issuecomment-671915381
    if (
      event.currentTarget === event.target &&
      event.currentTarget === this.props.elementProps.ref?.current
    ) {
      this.props.elementProps.onFocus(event)
    }
  }

  handleFilesOver = (hoveringFiles: FileInfo[]) => {
    this.setState({
      hoveringFiles: hoveringFiles.filter((file) => file.kind !== 'string'),
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

  handleClearField = () => {
    this.props.onChange([unset(['asset']), unset(['crop']), unset(['hotspot'])])
  }

  handleSelectFiles = (files: File[]) => {
    const {directUploads, readOnly} = this.props
    const {hoveringFiles} = this.state
    if (directUploads && !readOnly) {
      this.uploadFirstAccepted(files)
    } else if (hoveringFiles.length > 0) {
      this.handleFilesOut()
    }
  }

  handleSelectImageFromAssetSource = (source: AssetSource) => {
    this.setState({selectedAssetSource: source})
  }

  handleAssetSourceClosed = () => {
    this.setState({selectedAssetSource: null})

    // Set focus on menu button in `ImageActionsMenu` when closing the dialog
    this.state.menuButtonElement?.focus()
  }

  renderHotspotInput = (inputProps: Omit<InputProps, 'renderDefault'>) => {
    return (
      <ImageInputHotspotInput
        isImageToolEnabled={this.isImageToolEnabled()}
        handleCloseDialog={this.handleCloseDialog.bind(this)}
        imageInputProps={this.props}
        inputProps={inputProps}
      />
    )
  }

  renderPreview = () => {
    const {value, schemaType, readOnly, directUploads, imageUrlBuilder, resolveUploader} =
      this.props
    const {hoveringFiles} = this.state

    return (
      <ImageInputPreview
        directUploads={directUploads}
        handleOpenDialog={this.handleOpenDialog.bind(this)}
        hoveringFiles={hoveringFiles}
        imageUrlBuilder={imageUrlBuilder}
        readOnly={readOnly}
        resolveUploader={resolveUploader}
        schemaType={schemaType}
        value={value}
      />
    )
  }

  renderAssetMenu() {
    const {
      assetSources,
      directUploads,
      imageUrlBuilder,
      observeAsset,
      readOnly,
      schemaType,
      value,
    } = this.props

    return (
      <ImageInputAssetMenu
        assetSources={assetSources}
        directUploads={directUploads}
        handleOpenDialog={this.handleOpenDialog.bind(this)}
        handleRemoveButtonClick={this.handleRemoveButtonClick.bind(this)}
        handleSelectFiles={this.handleSelectFiles.bind(this)}
        handleSelectImageFromAssetSource={this.handleSelectImageFromAssetSource.bind(this)}
        imageUrlBuilder={imageUrlBuilder}
        isImageToolEnabled={this.isImageToolEnabled()}
        isMenuOpen={this.state.isMenuOpen}
        observeAsset={observeAsset}
        readOnly={readOnly}
        schemaType={schemaType}
        setHotspotButtonElement={this.setHotspotButtonElement.bind(this)}
        setMenuButtonElement={this.setMenuButtonElement.bind(this)}
        setMenuOpen={(isOpen) => this.setState({isMenuOpen: isOpen})}
        value={value}
      />
    )
  }

  renderBrowser() {
    const {assetSources, readOnly, directUploads, id} = this.props

    return (
      <ImageInputBrowser
        assetSources={assetSources}
        readOnly={readOnly}
        directUploads={directUploads}
        id={id}
        setMenuOpen={(isOpen) => this.setState({isMenuOpen: isOpen})}
        handleSelectImageFromAssetSource={this.handleSelectImageFromAssetSource.bind(this)}
      />
    )
  }

  renderUploadPlaceholder() {
    const {schemaType, readOnly, directUploads, resolveUploader} = this.props
    const {hoveringFiles} = this.state

    return (
      <ImageInputUploadPlaceholder
        directUploads={directUploads}
        handleSelectFiles={this.handleSelectFiles.bind(this)}
        hoveringFiles={hoveringFiles}
        readOnly={readOnly}
        renderBrowser={this.renderBrowser.bind(this)}
        resolveUploader={resolveUploader}
        schemaType={schemaType}
      />
    )
  }

  renderUploadState(uploadState: UploadState) {
    const {isUploading} = this.state

    // if there's a preview image already, preserve the height to avoid jumps
    const height = this._previewElement?.offsetHeight
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
    const {value, schemaType, observeAsset} = this.props

    return (
      <ImageInputAssetSource
        handleAssetSourceClosed={this.handleAssetSourceClosed.bind(this)}
        handleSelectAssetFromSource={this.handleSelectAssetFromSource.bind(this)}
        observeAsset={observeAsset}
        schemaType={schemaType}
        selectedAssetSource={selectedAssetSource}
        value={value}
      />
    )
  }

  setToast = (toast: {push: (params: ToastParams) => void}) => {
    this.toast = toast
  }

  getFileTone() {
    const {schemaType, value, readOnly, directUploads, resolveUploader} = this.props

    const {hoveringFiles} = this.state

    const acceptedFiles = hoveringFiles.filter((file) => resolveUploader(schemaType, file))
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

  renderAsset() {
    const {value, readOnly, elementProps} = this.props
    const {hoveringFiles, isStale} = this.state

    if (value && typeof value.asset !== 'undefined' && !value?._upload && !isImageSource(value)) {
      return () => <InvalidImageWarning onClearValue={this.handleClearField} />
    }

    return (inputProps: Omit<InputProps, 'renderDefault'>) => (
      <ImageInputAsset
        ref={this.setPreviewElement}
        elementProps={elementProps}
        handleClearUploadState={this.handleClearUploadState.bind(this)}
        handleFilesOut={this.handleFilesOut.bind(this)}
        handleFilesOver={this.handleFilesOver.bind(this)}
        handleFileTargetFocus={this.handleFileTargetFocus.bind(this)}
        handleSelectFiles={this.handleSelectFiles.bind(this)}
        hoveringFiles={hoveringFiles}
        inputProps={inputProps}
        isStale={isStale}
        readOnly={readOnly}
        renderAssetMenu={this.renderAssetMenu.bind(this)}
        renderPreview={this.renderPreview.bind(this)}
        renderUploadPlaceholder={this.renderUploadPlaceholder.bind(this)}
        renderUploadState={this.renderUploadState.bind(this)}
        tone={this.getFileTone()}
        value={value}
      />
    )
  }

  render() {
    const {
      focusPath,
      members,
      renderAnnotation,
      renderBlock,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
    } = this.props

    const {selectedAssetSource} = this.state

    // we use the hotspot field as the "owner" of both hotspot and crop
    const hotspotField = members.find(
      (member): member is FieldMember => member.kind === 'field' && member.name === 'hotspot',
    )

    return (
      // The Stack space should match the space in ObjectInput
      <Stack space={5} data-testid="image-input">
        <ImperativeToast ref={this.setToast} />
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
                renderInput={member.name === 'asset' ? this.renderAsset() : renderInput}
                renderField={member.name === 'asset' ? passThrough : renderField}
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
          return <>{t('inputs.image.error.unknown-member-kind', {kind: member.kind})}</>
        })}

        {hotspotField && focusPath[0] === 'hotspot' && (
          <FormInput
            {...this.props}
            absolutePath={hotspotField.field.path}
            renderInput={this.renderHotspotInput}
          />
        )}
        {selectedAssetSource && this.renderAssetSource()}
      </Stack>
    )
  }
}
