/* eslint-disable no-undef, import/no-unresolved */

import React from 'react'
import PropTypes from 'prop-types'
import {Observable, Subscription} from 'rxjs'
import {get, partition, uniqueId} from 'lodash'
import {FormFieldSet, ImperativeToast} from '@sanity/base/components'
import {
  Asset as AssetDocument,
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
import {
  BinaryDocumentIcon,
  ClipboardIcon,
  DownloadIcon,
  EditIcon,
  EyeOpenIcon,
  ImageIcon,
  ResetIcon,
  SearchIcon,
  TrashIcon,
  UploadIcon,
} from '@sanity/icons'
import {
  Box,
  Button,
  Container,
  Dialog,
  Flex,
  Grid,
  Menu,
  MenuButton,
  MenuItem,
  Stack,
  Text,
  Tooltip,
  ToastParams,
  MenuDivider,
} from '@sanity/ui'
import {PresenceOverlay, FormFieldPresence} from '@sanity/base/presence'
import WithMaterializedReference from '../../../utils/WithMaterializedReference'
import {Uploader, UploaderResolver, UploadOptions} from '../../../sanity/uploads/types'
import PatchEvent, {setIfMissing, unset} from '../../../PatchEvent'
import UploadFilePlaceholder from '../common/UploadFilePlaceholder'
import {FileInputButton} from '../common/FileInputButton/FileInputButton'
import {FileTarget, FileInfo, Overlay} from '../common/styles'
import {InternalAssetSource, UploadState} from '../types'
import {UploadProgress} from '../common/UploadProgress'
import {DropMessage} from '../common/DropMessage'
import {handleSelectAssetFromSource} from '../common/assetSource'
import resolveUploader from '../../../sanity/uploads/resolveUploader'
import {AssetBackground} from './styles'
import {FileInputField} from './FileInputField'
import FileContent from './FileContent'

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
  resolveUploader: UploaderResolver
  materialize: (documentId: string) => Observable<FileAsset>
  onBlur: () => void
  onFocus: (path: Path) => void
  readOnly: boolean | null
  focusPath: Path
  directUploads?: boolean
  assetSources?: InternalAssetSource[]
  markers: Marker[]
  presence: FormFieldPresence[]
}

const cardBorder = {borderStyle: 'dashed'}

const HIDDEN_FIELDS = ['asset']

type FileInputState = {
  isUploading: boolean
  selectedAssetSource: InternalAssetSource | null
  isAdvancedEditOpen: boolean
  hoveringFiles: FileInfo[]
}

type Focusable = {
  focus: () => void
}

export default class FileInput extends React.PureComponent<Props, FileInputState> {
  static contextTypes = {
    getValuePath: PropTypes.func,
  }

  _inputId = uniqueId('FileInput')
  dialogId = uniqueId('fileinput-dialog')

  _focusRef: Focusable | null = null
  uploadSubscription: Subscription | null = null

  state: FileInputState = {
    isUploading: false,
    isAdvancedEditOpen: false,
    selectedAssetSource: null,
    hoveringFiles: [],
  }

  toast: {push: (params: ToastParams) => void} | null = null

  handleRemoveButtonClick = () => {
    const {getValuePath} = this.context
    const {value} = this.props
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
    this.clearUploadStatus()
  }

  handleSelectFiles = (files: DOMFile[]) => {
    this.uploadFirstAccepted(files)
  }

  handleSelectFileFromAssetSource = (source: InternalAssetSource) => {
    this.setState({selectedAssetSource: source})
  }

  handleAssetSourceClosed = () => {
    this.setState({selectedAssetSource: null})
  }

  uploadFirstAccepted(files: DOMFile[]) {
    const {resolveUploader, type} = this.props

    const match = files
      .map((file) => ({file, uploader: resolveUploader(type, file)}))
      .find((result) => result.uploader)

    if (match) {
      this.uploadWith(match.uploader!, match.file)
    }
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
        onClearStale={this.handleClearUploadState}
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
          {(fileAsset) => {
            return (
              <Component
                selectedAssets={[fileAsset as AssetDocument]}
                selectionType="single"
                assetType="file"
                dialogHeaderTitle="Select file"
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
        assetType="file"
        dialogHeaderTitle="Select file"
        onClose={this.handleAssetSourceClosed}
        onSelect={this.handleSelectAssetFromSource}
      />
    )
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
  handleStartAdvancedEdit = () => {
    this.setState({isAdvancedEditOpen: true})
  }

  handleStopAdvancedEdit = () => {
    this.setState({isAdvancedEditOpen: false})
  }

  renderAdvancedEdit(fields: Field[]) {
    return (
      <Dialog
        header="Edit details"
        id={this.dialogId}
        onClose={this.handleStopAdvancedEdit}
        width={1}
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
    const {onChange, type, resolveUploader} = this.props
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

  handleFileTargetFocus = () => {
    this.props.onFocus(['asset'])
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

  renderAsset() {
    const {value, materialize, type, readOnly, assetSources} = this.props

    const accept = get(type, 'options.accept', '')

    return (
      <WithMaterializedReference reference={value!.asset} materialize={materialize}>
        {(assetDocument: FileAsset) => (
          <FileContent assetDocument={assetDocument}>
            <Menu>
              <Box marginTop={2} marginBottom={1} marginLeft={2}>
                <Text size={1} muted>
                  Replace
                </Text>
              </Box>
              <FileInputButton
                icon={UploadIcon}
                mode="ghost"
                onSelect={this.handleSelectFiles}
                accept={accept}
                text="Upload"
                data-testid="file-input-upload-button"
                disabled={readOnly}
                noBorder
              />
              <MenuItem
                icon={SearchIcon}
                text="Browse"
                onClick={() => this.handleSelectFileFromAssetSource(assetSources[0])}
              />
              <MenuDivider />
              <MenuItem
                as="a"
                icon={DownloadIcon}
                text="Download file"
                href={`${assetDocument.url}?dl`}
              />
              <MenuItem
                icon={ClipboardIcon}
                text="Copy URL"
                onClick={() => {
                  navigator.clipboard.writeText(assetDocument.url)
                }}
              />

              <MenuDivider />
              <MenuItem
                tone="critical"
                icon={ResetIcon}
                text="Clear field"
                onClick={this.handleRemoveButtonClick}
              />
            </Menu>
          </FileContent>
        )}
      </WithMaterializedReference>
    )
  }

  renderUploadPlaceholder() {
    const {assetSources, readOnly, type} = this.props
    const {hoveringFiles} = this.state
    if (!assetSources?.length) {
      return null
    }

    const acceptedFiles = hoveringFiles.filter((file) => resolveUploader(type, file))
    const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length

    // If multiple asset sources render a dropdown
    if (assetSources.length > 1 && !readOnly) {
      return (
        <MenuButton
          id={`${this._inputId}_assetFileButton`}
          button={<Button mode="ghost" text="Select…" icon={SearchIcon} />}
          data-testid="file-input-select-button"
          menu={
            <Menu>
              {assetSources.map((assetSource) => {
                return (
                  <MenuItem
                    key={assetSource.name}
                    text={assetSource.title}
                    onClick={() => this.handleSelectFileFromAssetSource(assetSource)}
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
      <UploadFilePlaceholder
        onBrowse={() => this.handleSelectFileFromAssetSource(assetSources[0])}
        onUpload={this.handleSelectFiles}
        readOnly={readOnly}
        hoveringFiles={hoveringFiles}
        acceptedFiles={acceptedFiles}
        rejectedFilesCount={rejectedFilesCount}
        type="file"
      />
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
      resolveUploader,
      readOnly,
      presence,
    } = this.props
    const {isAdvancedEditOpen, hoveringFiles, selectedAssetSource} = this.state
    const [highlightedFields, otherFields] = partition(
      type.fields.filter((field) => !HIDDEN_FIELDS.includes(field.name)),
      'type.options.isHighlighted'
    )

    // Whoever is present at the asset field is who we show on the field itself
    const assetFieldPresence = presence.filter((item) => item.path[0] === 'asset')

    function getFileTone() {
      const acceptedFiles = hoveringFiles.filter((file) => resolveUploader(type, file))
      const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length

      if (hoveringFiles) {
        if (rejectedFilesCount > 0) {
          return 'critical'
        }
      }

      if (!value?._upload && !readOnly && hoveringFiles.length > 0) {
        return 'primary'
      }
      return value?._upload && value?.asset ? 'transparent' : 'default'
    }

    return (
      <>
        <ImperativeToast ref={this.setToast} />

        <FormFieldSet
          __unstable_markers={markers}
          title={type.title}
          description={type.description}
          level={highlightedFields.length > 0 ? level : 0}
          __unstable_presence={assetFieldPresence}
          __unstable_changeIndicator={false}
        >
          <div>
            <ChangeIndicatorCompareValueProvider
              value={value?.asset?._ref}
              compareValue={compareValue?.asset?._ref}
            >
              <ChangeIndicatorWithProvidedFullPath
                path={[]}
                hasFocus={this.hasFileTargetFocus()}
                value={value?.asset?._ref}
              >
                <FileTarget
                  tabIndex={readOnly ? undefined : 0}
                  disabled={readOnly === true}
                  ref={this.setFocusInput}
                  onFiles={this.handleSelectFiles}
                  onFilesOver={this.handleFilesOver}
                  onFilesOut={this.handleFilesOut}
                  onFocus={this.handleFileTargetFocus}
                  onBlur={this.handleFileTargetBlur}
                  border
                  padding={4}
                  tone={getFileTone()}
                  style={cardBorder}
                  readOnly={readOnly}
                >
                  {value?._upload && this.renderUploadState(value._upload)}
                  {!value?._upload && value?.asset && this.renderAsset()}
                  {!value?._upload && !value?.asset && this.renderUploadPlaceholder()}
                </FileTarget>
              </ChangeIndicatorWithProvidedFullPath>
            </ChangeIndicatorCompareValueProvider>
          </div>

          {highlightedFields.length > 0 && this.renderFields(highlightedFields)}
          {isAdvancedEditOpen && this.renderAdvancedEdit(otherFields)}
          {selectedAssetSource && this.renderAssetSource()}
        </FormFieldSet>
      </>
    )
  }
}
