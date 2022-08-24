/* eslint-disable no-undef, import/no-unresolved */

import React, {ReactNode} from 'react'
import {Observable, Subscription} from 'rxjs'
import {get, partition, uniqueId} from 'lodash'
import {FormFieldSet, ImperativeToast} from '@sanity/base/components'
import {
  AssetFromSource,
  File as BaseFile,
  FileAsset,
  FileSchemaType,
  Marker,
  Path,
  SchemaType,
} from '@sanity/types'
import {
  ChangeIndicatorCompareValueProvider,
  ChangeIndicatorWithProvidedFullPath,
} from '@sanity/base/change-indicators'
import {ImageIcon, SearchIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Menu, MenuButton, MenuItem, ToastParams} from '@sanity/ui'
import {PresenceOverlay, FormFieldPresence} from '@sanity/base/presence'
import {isFileSource} from '@sanity/asset-utils'
import {WithReferencedAsset} from '../../../utils/WithReferencedAsset'
import {Uploader, UploaderResolver, UploadOptions} from '../../../sanity/uploads/types'
import PatchEvent, {setIfMissing, unset} from '../../../PatchEvent'
import {FileTarget, FileInfo} from '../common/styles'
import {InternalAssetSource, UploadState} from '../types'
import {UploadProgress} from '../common/UploadProgress'
import {handleSelectAssetFromSource} from '../common/assetSource'
import resolveUploader from '../../../sanity/uploads/resolveUploader'
import {ActionsMenu} from '../common/ActionsMenu'
import {PlaceholderText} from '../common/PlaceholderText'
import UploadPlaceholder from '../common/UploadPlaceholder'
import {UploadWarning} from '../common/UploadWarning'
import {EMPTY_ARRAY} from '../../../utils/empty'
import {CardOverlay, FlexContainer} from './styles'
import {FileInputField} from './FileInputField'
import {FileDetails} from './FileDetails'
import {FileSkeleton} from './FileSkeleton'
import {InvalidFileWarning} from './InvalidFileWarning'

type Field = {
  name: string
  type: SchemaType
}

// We alias DOM File type here to distinguish it from the type of the File value
type DOMFile = globalThis.File

export interface File extends Partial<BaseFile> {
  _upload?: UploadState
}

export type Props = {
  value?: File
  compareValue?: File
  type: FileSchemaType
  level: number
  onChange: (event: PatchEvent) => void
  // eslint-disable-next-line react/no-unused-prop-types
  resolveUploader: UploaderResolver
  observeAsset: (documentId: string) => Observable<FileAsset>
  onBlur: () => void
  onFocus: (path: Path) => void
  readOnly: boolean | null
  focusPath: Path
  directUploads?: boolean
  assetSources: InternalAssetSource[]
  markers: Marker[]
  presence: FormFieldPresence[]
  getValuePath: () => Path
}

const HIDDEN_FIELDS = ['asset']

type FileInputState = {
  isUploading: boolean
  selectedAssetSource: InternalAssetSource | null
  hoveringFiles: FileInfo[]
  isStale: boolean
  isMenuOpen: boolean
}

type Focusable = {
  focus: () => void
}

export default class FileInput extends React.PureComponent<Props, FileInputState> {
  _inputId = uniqueId('FileInput')
  dialogId = uniqueId('fileinput-dialog')

  _focusRef: Focusable | null = null
  uploadSubscription: Subscription | null = null

  state: FileInputState = {
    isUploading: false,
    selectedAssetSource: null,
    hoveringFiles: [],
    isStale: false,
    isMenuOpen: false,
  }

  toast: {push: (params: ToastParams) => void} | null = null

  handleRemoveButtonClick = () => {
    const {value, getValuePath} = this.props
    const parentPathSegment = getValuePath().slice(-1)[0]

    // String path segment mean an object path, while a number or a
    // keyed segment means we're a direct child of an array
    const isArrayElement = typeof parentPathSegment !== 'string'

    // When removing the file, _type and _key are "meta"-properties and
    // are not significant unless other properties are present. Thus, we
    // want to remove the entire "container" object if these are the only
    // properties present, BUT only if we're not an array element, as
    // removing the array element will close the selection dialog. Instead,
    // when closing the dialog, the array logic will check for an "empty"
    // value and remove it for us
    const allKeys = Object.keys(value || {})
    const remainingKeys = allKeys.filter(
      (key) => !['_type', '_key', '_upload', 'asset'].includes(key)
    )

    const isEmpty = remainingKeys.length === 0
    const removeKeys = ['asset']
      .concat(allKeys.filter((key) => ['_upload'].includes(key)))
      .map((key) => unset([key]))

    this.props.onChange(PatchEvent.from(isEmpty && !isArrayElement ? unset() : removeKeys))
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
    this.props.onChange(PatchEvent.from(unset(['asset'])))
  }

  handleSelectFiles = (files: DOMFile[]) => {
    const {directUploads, readOnly, value} = this.props
    const {hoveringFiles} = this.state

    if (directUploads && !readOnly) {
      this.uploadFirstAccepted(files)
    } else if (hoveringFiles.length > 0) {
      this.handleFilesOut()
    }
  }

  handleSelectFileFromAssetSource = (source: InternalAssetSource) => {
    this.setState({selectedAssetSource: source})
  }

  handleAssetSourceClosed = () => {
    this.setState({selectedAssetSource: null})
  }

  uploadFirstAccepted(files: DOMFile[]) {
    const {type} = this.props

    const match = files
      .map((file) => ({file, uploader: resolveUploader(type, file)}))
      .find((result) => result.uploader)

    if (match) {
      this.uploadWith(match.uploader!, match.file)
    }

    this.setState({isMenuOpen: false})
  }

  uploadWith = (uploader: Uploader, file: DOMFile, assetDocumentProps: UploadOptions = {}) => {
    const {type, onChange} = this.props
    const {source} = assetDocumentProps
    const options = {
      metadata: get(type, 'options.metadata'),
      storeOriginalFilename: get(type, 'options.storeOriginalFilename'),
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
        this.setState({isUploading: false})
      },
    })
  }

  renderUploadState(uploadState: UploadState) {
    const {isUploading} = this.state

    return (
      <UploadProgress
        uploadState={uploadState}
        onCancel={isUploading ? this.handleCancelUpload : undefined}
        onStale={this.handleStaleUpload}
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
        <WithReferencedAsset
          observeAsset={observeAsset}
          reference={value.asset}
          waitPlaceholder={<FileSkeleton />}
        >
          {(fileAsset) => (
            <Component
              selectedAssets={[fileAsset]}
              selectionType="single"
              assetType="file"
              dialogHeaderTitle="Select file"
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
        assetType="file"
        dialogHeaderTitle="Select file"
        onClose={this.handleAssetSourceClosed}
        onSelect={this.handleSelectAssetFromSource}
      />
    )
  }

  handleFieldChange = (event: PatchEvent) => {
    const {onChange, type} = this.props

    // When editing a metadata field for a file (eg `description`), and no asset
    // is currently selected, we want to unset the entire file field if the
    // field we are currently editing goes blank and gets unset.
    //
    // For instance:
    // A file field with a `description` and a `title` subfield, where the file `asset`
    // and the `title` field is empty, and we are erasing the `description` field.
    // We do _not_ however want to clear the field if any content is present in
    // the other fields, eg if `title` _has_ a value and we erase `description`
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
    const remainingKeys = allKeys.filter((key) => !['_type', '_key'].includes(key))

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
    const {type, onFocus} = this.props
    const otherFields = type.fields.filter(
      (field) => !HIDDEN_FIELDS.includes(field.name) && !(field.type as any)?.options?.isHighlighted
    )

    /* for context: this code will only ever run if there are fields which are not highlighted.
    in the FileDetails component (used in the renderAsset method) there is a button which is active if there are
    fields that are not highlighted, opening this dialog */
    onFocus([otherFields[0].name])
  }

  handleStopAdvancedEdit = () => {
    this.props.onFocus([])
  }

  renderAdvancedEdit(fields: Field[]) {
    return (
      <Dialog
        header="Edit details"
        id={this.dialogId}
        onClose={this.handleStopAdvancedEdit}
        width={1}
        __unstable_autoFocus={false}
      >
        <PresenceOverlay margins={[0, 0, 1, 0]}>
          <Box padding={4}>{this.renderFields(fields)}</Box>
        </PresenceOverlay>
      </Dialog>
    )
  }

  renderFields(fields: Field[]) {
    return fields.map((field) => this.renderField(field))
  }

  handleSelectAssetFromSource = (assetFromSource: AssetFromSource) => {
    const {onChange, type} = this.props
    handleSelectAssetFromSource({
      assetFromSource,
      onChange,
      type,
      resolveUploader,
      uploadWith: this.uploadWith,
    })
    this.setState({selectedAssetSource: null})
  }

  hasFileTargetFocus() {
    return this.props.focusPath?.[0] === 'asset'
  }

  handleFileTargetFocus = (event) => {
    // We want to handle focus when the file target element *itself* receives
    // focus, not when an interactive child element receives focus. Since React has decided
    // to let focus bubble, so this workaround is needed
    // Background: https://github.com/facebook/react/issues/6410#issuecomment-671915381
    if (event.currentTarget === event.target && event.currentTarget === this._focusRef) {
      this.props.onFocus(['asset'])
    }
  }
  handleFileTargetBlur = () => {
    this.props.onBlur()
  }
  handleFilesOver = (fileInfo: FileInfo[]) => {
    this.setState({
      hoveringFiles: fileInfo,
    })
  }
  handleFilesOut = () => {
    this.setState({
      hoveringFiles: [],
    })
  }

  renderField(field: Field) {
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
      <FileInputField
        key={field.name}
        field={field}
        parentValue={value}
        value={fieldValue}
        onChange={this.handleFieldChange}
        onFocus={onFocus}
        compareValue={compareValue}
        onBlur={onBlur}
        readOnly={readOnly || field.type.readOnly}
        focusPath={focusPath}
        level={level}
        presence={presence}
        markers={fieldMarkers}
      />
    )
  }

  renderAsset(hasAdvancedFields: boolean) {
    const {value, readOnly, assetSources, type, directUploads, observeAsset} = this.props
    const {isMenuOpen} = this.state
    const asset = value?.asset
    if (!asset) {
      return null
    }

    const accept = get(type, 'options.accept', 'image/*')

    let browseMenuItem: ReactNode =
      assetSources && assetSources?.length === 0 ? null : (
        <MenuItem
          icon={SearchIcon}
          text="Browse"
          onClick={() => {
            this.setState({isMenuOpen: false})
            this.handleSelectFileFromAssetSource(assetSources[0])
          }}
          disabled={readOnly}
          data-testid="file-input-browse-button"
        />
      )

    if (assetSources.length > 1) {
      browseMenuItem = assetSources.map((assetSource) => {
        return (
          <MenuItem
            key={assetSource.name}
            text={assetSource.title}
            onClick={() => {
              this.setState({isMenuOpen: false})
              this.handleSelectFileFromAssetSource(assetSource)
            }}
            icon={assetSource.icon || ImageIcon}
            disabled={readOnly}
            data-testid={`file-input-browse-button-${assetSource.name}`}
          />
        )
      })
    }

    return (
      <WithReferencedAsset
        reference={asset}
        observeAsset={observeAsset}
        waitPlaceholder={<FileSkeleton />}
      >
        {(assetDocument) => (
          <FileDetails
            size={assetDocument.size}
            originalFilename={
              assetDocument?.originalFilename || `download.${assetDocument.extension}`
            }
            onClick={hasAdvancedFields ? this.handleOpenDialog : undefined}
            muted={!hasAdvancedFields && readOnly}
            disabled={!hasAdvancedFields}
            onMenuOpen={(isOpen) => this.setState({isMenuOpen: isOpen})}
            isMenuOpen={isMenuOpen}
          >
            <ActionsMenu
              onUpload={this.handleSelectFiles}
              browse={browseMenuItem}
              onReset={this.handleRemoveButtonClick}
              downloadUrl={`${assetDocument.url}?dl`}
              copyUrl={`${assetDocument.url}`}
              readOnly={readOnly}
              accept={accept}
              directUploads={directUploads}
            />
          </FileDetails>
        )}
      </WithReferencedAsset>
    )
  }

  renderAssetMenu(tone) {
    const {type, readOnly, directUploads} = this.props
    const {hoveringFiles} = this.state

    const acceptedFiles = hoveringFiles.filter((file) => resolveUploader(type, file))
    const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length

    return (
      <CardOverlay tone={tone}>
        <FlexContainer align="center" justify="center" gap={2} flex={1}>
          <PlaceholderText
            readOnly={readOnly}
            hoveringFiles={hoveringFiles}
            acceptedFiles={acceptedFiles}
            rejectedFilesCount={rejectedFilesCount}
            directUploads={directUploads}
            type={'file'}
          />
        </FlexContainer>
      </CardOverlay>
    )
  }

  renderBrowser() {
    const {assetSources, readOnly, directUploads} = this.props

    if (assetSources.length === 0) return null

    if (assetSources.length > 1 && !readOnly && directUploads) {
      return (
        <MenuButton
          id={`${this._inputId}_assetFileButton`}
          button={
            <Button
              mode="ghost"
              text="Select"
              data-testid="file-input-multi-browse-button"
              icon={SearchIcon}
            />
          }
          data-testid="input-select-button"
          menu={
            <Menu>
              {assetSources.map((assetSource) => {
                return (
                  <MenuItem
                    key={assetSource.name}
                    text={assetSource.title}
                    onClick={() => {
                      this.setState({isMenuOpen: false})
                      this.handleSelectFileFromAssetSource(assetSource)
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
        text="Browse"
        icon={SearchIcon}
        mode="ghost"
        onClick={() => {
          this.setState({isMenuOpen: false})
          this.handleSelectFileFromAssetSource(assetSources[0])
        }}
        data-testid="file-input-browse-button"
        disabled={readOnly}
      />
    )
  }

  renderUploadPlaceholder() {
    const {readOnly, type, directUploads} = this.props
    const {hoveringFiles} = this.state

    const acceptedFiles = hoveringFiles.filter((file) => resolveUploader(type, file))
    const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length

    const accept = get(type, 'options.accept', '')

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
            type="file"
            accept={accept}
            directUploads={directUploads}
          />
        </Card>
      </div>
    )
  }

  focus() {
    if (this._focusRef) {
      this._focusRef.focus()
    }
  }

  setFocusInput = (ref: Focusable | null) => {
    this._focusRef = ref
  }

  handleUpload = ({file, uploader}: {file: DOMFile; uploader: Uploader}) => {
    this.uploadWith(uploader, file)
  }

  setToast = (toast: {push: (params: ToastParams) => void}) => {
    this.toast = toast
  }

  render() {
    const {
      directUploads,
      type,
      value,
      compareValue,
      level,
      markers,
      readOnly,
      presence,
      focusPath = EMPTY_ARRAY,
    } = this.props
    const {hoveringFiles, selectedAssetSource, isStale} = this.state

    const fieldGroups = partition(
      type.fields.filter((field) => !HIDDEN_FIELDS.includes(field.name)),
      'type.options.isHighlighted'
    )
    const [highlightedFields, otherFields] = fieldGroups

    // Whoever is present at the asset field is who we show on the field itself
    const assetFieldPresence = presence.filter((item) => item.path[0] === 'asset')

    const isDialogOpen =
      focusPath.length > 0 && otherFields.some((field) => focusPath[0] === field.name)

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
      return value?._upload && value?.asset && readOnly ? 'transparent' : 'default'
    }

    const hasValueOrUpload = Boolean(value?._upload || value?.asset)
    const hasInvalidFile =
      value && typeof value.asset !== 'undefined' && !value?._upload && !isFileSource(value)

    return (
      <>
        <ImperativeToast ref={this.setToast} />

        <FormFieldSet
          __unstable_markers={markers}
          title={type.title}
          description={type.description}
          level={highlightedFields.length > 0 ? level : 0}
          __unstable_presence={isDialogOpen ? EMPTY_ARRAY : assetFieldPresence}
          __unstable_changeIndicator={false}
        >
          <div>
            <ChangeIndicatorCompareValueProvider
              value={value?.asset?._ref}
              compareValue={compareValue?.asset?._ref}
            >
              {isStale && (
                <Box marginBottom={2}>
                  <UploadWarning onClearStale={this.handleClearUploadState} />
                </Box>
              )}

              <ChangeIndicatorWithProvidedFullPath
                path={[]}
                hasFocus={this.hasFileTargetFocus()}
                value={value?.asset?._ref}
              >
                {/* not uploading */}
                {!value?._upload && !hasInvalidFile && (
                  <FileTarget
                    tabIndex={0}
                    disabled={Boolean(readOnly)}
                    ref={this.setFocusInput}
                    onFiles={this.handleSelectFiles}
                    onFilesOver={this.handleFilesOver}
                    onFilesOut={this.handleFilesOut}
                    onFocus={this.handleFileTargetFocus}
                    onBlur={this.handleFileTargetBlur}
                    tone={getFileTone()}
                    $border={hasValueOrUpload || hoveringFiles.length > 0}
                    padding={hasValueOrUpload ? 1 : 0}
                    radius={2}
                  >
                    {value?.asset && this.renderAsset(otherFields.length > 0)}
                    {!value?.asset && this.renderUploadPlaceholder()}
                    {value?.asset && hoveringFiles.length > 0
                      ? this.renderAssetMenu(getFileTone())
                      : null}
                  </FileTarget>
                )}

                {hasInvalidFile && <InvalidFileWarning onClearValue={this.handleClearField} />}

                {/* uploading */}
                {value?._upload && this.renderUploadState(value._upload)}
              </ChangeIndicatorWithProvidedFullPath>
            </ChangeIndicatorCompareValueProvider>
          </div>

          {highlightedFields.length > 0 && this.renderFields(highlightedFields)}
          {isDialogOpen && this.renderAdvancedEdit(otherFields)}
          {selectedAssetSource && this.renderAssetSource()}
        </FormFieldSet>
      </>
    )
  }
}
