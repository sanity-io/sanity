/* eslint-disable react/jsx-no-bind */
/* eslint-disable import/no-unresolved,react/jsx-handler-names, react/display-name, react/no-this-in-sfc */

import {
  Box,
  Button,
  Card,
  Dialog,
  Menu,
  MenuButton,
  MenuButtonProps,
  MenuItem,
  Stack,
  ToastParams,
} from '@sanity/ui'
import {get} from 'lodash'
import {Observable, Subscription} from 'rxjs'
import {ChevronDownIcon, ImageIcon, SearchIcon} from '@sanity/icons'
import {
  AssetFromSource,
  AssetSource,
  Image as BaseImage,
  ImageAsset,
  ImageSchemaType,
  Path,
  UploadState,
} from '@sanity/types'
import React, {ReactNode} from 'react'
import {SanityClient} from '@sanity/client'
import {isImageSource} from '@sanity/asset-utils'
import {PatchEvent, setIfMissing, unset} from '../../../patch'
import {FieldMember} from '../../../store'
import {InputProps, ObjectInputProps} from '../../../types'
import {
  ResolvedUploader,
  Uploader,
  UploaderResolver,
  UploadOptions,
} from '../../../studio/uploads/types'
import {UploadPlaceholder} from '../common/UploadPlaceholder'
import {WithReferencedAsset} from '../../../utils/WithReferencedAsset'
import {FileTarget} from '../common/styles'
import {ImageUrlBuilder} from '../types'
import {UploadProgress} from '../common/UploadProgress'
import {handleSelectAssetFromSource} from '../common/assetSource'
import {ActionsMenu} from '../common/ActionsMenu'
import {UploadWarning} from '../common/UploadWarning'
import {ImageToolInput} from '../ImageToolInput'
import {FormInput} from '../../../components'
import {MemberField, MemberFieldError, MemberFieldSet} from '../../../members'
import {PresenceOverlay} from '../../../../presence'
import {FIXME} from '../../../../FIXME'
import {ImperativeToast} from '../../../../components'
import {ChangeIndicator} from '../../../../changeIndicators'
import {ImageActionsMenu} from './ImageActionsMenu'
import {ImagePreview} from './ImagePreview'
import {InvalidImageWarning} from './InvalidImageWarning'

/**
 * @hidden
 * @beta */
export interface BaseImageInputValue extends Partial<BaseImage> {
  _upload?: UploadState
}

/**
 * @hidden
 * @beta */
export interface BaseImageInputProps
  extends ObjectInputProps<BaseImageInputValue, ImageSchemaType> {
  assetSources: AssetSource[]
  directUploads?: boolean
  imageUrlBuilder: ImageUrlBuilder
  observeAsset: (documentId: string) => Observable<ImageAsset>
  resolveUploader: UploaderResolver
  client: SanityClient
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

function passThrough({children}: {children?: React.ReactNode}) {
  return children
}

const ASSET_FIELD_PATH = ['asset']

const ASSET_IMAGE_MENU_POPOVER: MenuButtonProps['popover'] = {portal: true}

/** @internal */
export class BaseImageInput extends React.PureComponent<BaseImageInputProps, BaseImageInputState> {
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
    const {schemaType, onChange, client} = this.props
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
          description: 'The upload could not be completed at this time.',
          title: 'Upload failed',
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
    const {onFieldOpen} = this.props
    onFieldOpen('hotspot')
  }

  handleCloseDialog = () => {
    const {onFieldClose} = this.props
    onFieldClose('hotspot')

    // Set focus on hotspot button in `ImageActionsMenu` when closing the dialog
    this.state.hotspotButtonElement?.focus()
  }

  handleSelectAssetFromSource = (assetFromSource: AssetFromSource[]) => {
    const {onChange, schemaType, resolveUploader} = this.props
    handleSelectAssetFromSource({
      assetFromSource,
      onChange,
      type: schemaType,
      resolveUploader,
      uploadWith: this.uploadWith,
      isImage: true,
    })

    this.setState({selectedAssetSource: null})
  }

  handleFileTargetFocus = (event: React.FocusEvent) => {
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

  renderHotspotInput = (hotspotInputProps: Omit<InputProps, 'renderDefault'>) => {
    const {value, changed, id, imageUrlBuilder} = this.props

    const withImageTool = this.isImageToolEnabled() && value && value.asset

    return (
      <Dialog
        __unstable_autoFocus={false}
        header="Edit hotspot and crop"
        id={`${id}_dialog`}
        onClickOutside={this.handleCloseDialog}
        onClose={this.handleCloseDialog}
        width={1}
      >
        <PresenceOverlay>
          <Box padding={4}>
            <Stack space={5}>
              {withImageTool && value?.asset && (
                <ImageToolInput
                  {...this.props}
                  imageUrl={imageUrlBuilder.image(value.asset).url()}
                  value={value as FIXME}
                  presence={hotspotInputProps.presence}
                  changed={changed}
                />
              )}
            </Stack>
          </Box>
        </PresenceOverlay>
      </Dialog>
    )
  }

  renderPreview = () => {
    const {value, schemaType, readOnly, directUploads, imageUrlBuilder, resolveUploader} =
      this.props

    if (!value || !isImageSource(value)) {
      return null
    }

    const {hoveringFiles} = this.state

    const acceptedFiles = hoveringFiles.filter((file) => resolveUploader(schemaType, file))

    const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length
    const imageUrl = imageUrlBuilder
      .width(2000)
      .fit('max')
      .image(value)
      .dpr(getDevicePixelRatio())
      .auto('format')
      .url()

    return (
      <ImagePreview
        drag={!value?._upload && hoveringFiles.length > 0}
        isRejected={rejectedFilesCount > 0 || !directUploads}
        readOnly={readOnly}
        src={imageUrl}
        alt="Preview of uploaded image"
      />
    )
  }

  renderAssetMenu() {
    const {
      value,
      assetSources,
      schemaType,
      readOnly,
      directUploads,
      imageUrlBuilder,
      observeAsset,
    } = this.props

    const asset = value?.asset
    if (!asset) {
      return null
    }

    const accept = get(schemaType, 'options.accept', 'image/*')

    const showAdvancedEditButton = value && asset && this.isImageToolEnabled()

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
        {({_id, originalFilename, extension}) => {
          let copyUrl: string | undefined
          let downloadUrl: string | undefined

          if (isImageSource(value)) {
            const filename = originalFilename || `download.${extension}`
            downloadUrl = imageUrlBuilder.image(_id).forceDownload(filename).url()
            copyUrl = imageUrlBuilder.image(_id).url()
          }

          return (
            <ImageActionsMenu
              isMenuOpen={this.state.isMenuOpen}
              onEdit={this.handleOpenDialog}
              onMenuOpen={(isOpen) => this.setState({isMenuOpen: isOpen})}
              setHotspotButtonElement={this.setHotspotButtonElement}
              setMenuButtonElement={this.setMenuButtonElement}
              showEdit={showAdvancedEditButton}
            >
              <ActionsMenu
                onUpload={this.handleSelectFiles}
                browse={browseMenuItem}
                onReset={this.handleRemoveButtonClick}
                downloadUrl={downloadUrl}
                copyUrl={copyUrl}
                readOnly={readOnly}
                directUploads={directUploads}
                accept={accept}
              />
            </ImageActionsMenu>
          )
        }}
      </WithReferencedAsset>
    )
  }

  renderBrowser() {
    const {assetSources, readOnly, directUploads, id} = this.props

    if (assetSources && assetSources.length === 0) return null

    if (assetSources && assetSources.length > 1 && !readOnly && directUploads) {
      return (
        <MenuButton
          id={`${id}_assetImageButton`}
          ref={this.setMenuButtonElement}
          button={
            <Button
              data-testid="file-input-multi-browse-button"
              icon={SearchIcon}
              iconRight={ChevronDownIcon}
              mode="ghost"
              text="Select"
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
          popover={ASSET_IMAGE_MENU_POPOVER}
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
    const {schemaType, readOnly, directUploads, resolveUploader} = this.props

    const {hoveringFiles} = this.state

    const acceptedFiles = hoveringFiles.filter((file) => resolveUploader(schemaType, file))
    const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length

    const accept = get(schemaType, 'options.accept', 'image/*')

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
    const accept = get(schemaType, 'options.accept', 'image/*')

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
              accept={accept}
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
        accept={accept}
        onClose={this.handleAssetSourceClosed}
        onSelect={this.handleSelectAssetFromSource}
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

    const hasValueOrUpload = Boolean(value?._upload || value?.asset)

    if (value && typeof value.asset !== 'undefined' && !value?._upload && !isImageSource(value)) {
      return () => <InvalidImageWarning onClearValue={this.handleClearField} />
    }

    // todo: convert this to a functional component and use this with useCallback
    //  it currently has to return a new function on every render in order to pick up state from this component
    return (inputProps: Omit<InputProps, 'renderDefault'>) => (
      <>
        {isStale && (
          <Box marginBottom={2}>
            <UploadWarning onClearStale={this.handleClearUploadState} />
          </Box>
        )}

        <ChangeIndicator
          path={inputProps.path.concat(ASSET_FIELD_PATH)}
          hasFocus={!!inputProps.focused}
          isChanged={inputProps.changed}
        >
          {value?._upload ? (
            this.renderUploadState(value._upload)
          ) : (
            <FileTarget
              {...elementProps}
              onFocus={this.handleFileTargetFocus}
              tabIndex={0}
              disabled={Boolean(readOnly)}
              onFiles={this.handleSelectFiles}
              onFilesOver={this.handleFilesOver}
              onFilesOut={this.handleFilesOut}
              tone={this.getFileTone()}
              $border={hasValueOrUpload || hoveringFiles.length > 0}
              style={{padding: 1}}
              sizing="border"
              radius={2}
            >
              {!value?.asset && this.renderUploadPlaceholder()}
              {!value?._upload && value?.asset && (
                <div style={{position: 'relative'}} ref={this.setPreviewElement}>
                  {this.renderPreview()}
                  {this.renderAssetMenu()}
                </div>
              )}
            </FileTarget>
          )}
        </ChangeIndicator>
      </>
    )
  }

  render() {
    const {
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
          return <>Unknown member kind: ${member.kind}</>
        })}
        {hotspotField?.open && (
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
