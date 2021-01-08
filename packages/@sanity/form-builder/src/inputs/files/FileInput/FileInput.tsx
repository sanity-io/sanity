import React from 'react'
import PropTypes from 'prop-types'
import {Observable, Subscription} from 'rxjs'
import {get, partition, uniqueId} from 'lodash'
import {ImperativeToast, ToastParams} from '@sanity/base/components'
import {Marker, Path, File as BaseFile, FileAsset, SchemaType, FileSchemaType} from '@sanity/types'
import {ChangeIndicatorCompareValueProvider} from '@sanity/base/lib/change-indicators/ChangeIndicator'
import {ChangeIndicatorWithProvidedFullPath} from '@sanity/base/lib/change-indicators'
import {
  CloseIcon,
  EditIcon,
  EyeOpenIcon,
  BinaryDocumentIcon,
  UploadIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import {Box, Button, Grid, Dialog, Flex, Text, Inline} from '@sanity/ui'
import {PresenceOverlay} from '@sanity/base/presence'
import {FormFieldPresence} from '@sanity/base/lib/presence'

import prettyMs from 'pretty-ms'
import WithMaterializedReference from '../../../utils/WithMaterializedReference'
import {ResolvedUploader, Uploader, UploaderResolver} from '../../../sanity/uploads/types'
import PatchEvent, {setIfMissing, unset} from '../../../PatchEvent'
import {FormBuilderInput} from '../../../FormBuilderInput'
import UploadPlaceholder from '../common/UploadPlaceholder'
import {FileInputButton} from '../common/FileInputButton/FileInputButton'
import {CircularProgress} from '../../../components/progress'
import {FormFieldSet} from '../../../components/FormField'
import {AssetBackground, FileTarget, Overlay} from './styles'

type Field = {
  name: string
  type: SchemaType
}

interface UploadState {
  progress: number
  initiated: string
  updated: string
  file: {name: string; type: string}
}

interface FileValue extends Partial<BaseFile> {
  _upload?: UploadState
}

export type Props = {
  value?: FileValue
  compareValue?: FileValue
  type: FileSchemaType
  level: number
  onChange: (event: PatchEvent) => void
  resolveUploader: UploaderResolver
  materialize: (documentId: string) => Observable<FileAsset>
  onBlur: () => void
  onFocus: (path: Path) => void
  readOnly: boolean | null
  focusPath: Path
  markers: Marker[]
  presence: FormFieldPresence[]
}

const HIDDEN_FIELDS = ['asset', 'hotspot', 'crop']

// If it's more than this amount of milliseconds since last time _upload state was reported
// the upload will be marked as stale/interrupted
const STALE_UPLOAD_MS = 1000 * 60 * 2

const elapsedMs = (date: string): number => new Date().getTime() - new Date(date).getTime()

type FileInputState = {
  isUploading: boolean
  isAdvancedEditOpen: boolean
  hasFileTargetFocus: boolean
  isDraggingOver: boolean
}

export default class FileInput extends React.PureComponent<Props, FileInputState> {
  static contextTypes = {
    getValuePath: PropTypes.func,
  }

  dialogId = uniqueId('fileinput-dialog')

  _focusArea: any
  uploadSubscription: Subscription = null

  state: FileInputState = {
    isUploading: false,
    isAdvancedEditOpen: false,
    hasFileTargetFocus: false,
    isDraggingOver: false,
  }

  toast: {push: (params: ToastParams) => void}

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
    const allKeys = Object.keys(value)
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
    this.props.onChange(PatchEvent.from([unset(['_upload'])])) // todo: this is kind of hackish
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

  handleSelectFileList = (fileList: FileList) => {
    this.uploadFirstAccepted(Array.from(fileList))
  }

  handleSelectFiles = (files: File[]) => {
    this.uploadFirstAccepted(files)
  }

  uploadFirstAccepted(files: File[]) {
    const {resolveUploader, type} = this.props
    let match: {
      uploader: Uploader
      file: globalThis.File
    } | null = null
    files.some((file) => {
      const uploader = resolveUploader(type, file)
      if (uploader) {
        match = {file, uploader}
        return true
      }
      return false
    })
    if (match) {
      this.uploadWith(match.uploader, match.file)
    }
  }

  uploadWith(uploader: Uploader, file: globalThis.File) {
    const {type, onChange} = this.props
    const options = {
      metadata: get(type, 'options.metadata'),
      storeOriginalFilename: get(type, 'options.storeOriginalFilename'),
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
        this.toast.push({
          status: 'error',
          description: 'The upload could not be completed at this time.',
          title: 'Upload failed',
        })
        this.clearUploadStatus()
      },
      complete: () => {
        onChange(PatchEvent.from([unset(['hotspot']), unset(['crop'])]))
        this.setState({isUploading: false})
      },
    })
  }

  renderMaterializedAsset = (assetDocument: FileAsset) => {
    return (
      <Flex align="center" justify="center">
        <Box>
          <BinaryDocumentIcon fontSize="3em" />
        </Box>
        <Box>
          <Box padding={1}>
            <Text size={1} weight="bold">
              {assetDocument.originalFilename}
            </Text>
          </Box>
          <Box padding={1}>
            <Button as="a" href={`${assetDocument.url}?dl`} mode="ghost" text="Download" />
          </Box>
        </Box>
      </Flex>
    )
  }

  renderUploadState(uploadState: UploadState) {
    const {isUploading} = this.state
    const completed = uploadState.progress === 100
    const filename = get(uploadState, 'file.name')

    const stalled = elapsedMs(uploadState.updated) > STALE_UPLOAD_MS

    return (
      <Flex>
        <Box padding={4}>
          <Flex direction="column" align="center">
            <CircularProgress value={completed ? 100 : uploadState.progress} />
            {stalled && (
              <>
                <Inline padding={2} flex={1} marginTop={3}>
                  <Text size={1}>
                    <WarningOutlineIcon />
                  </Text>{' '}
                  <Box marginLeft={2}>
                    <Text size={1}>Upload stalled</Text>
                  </Box>
                </Inline>
                <Box padding={2}>
                  <Text muted size={1}>
                    This upload didn't make any progress in the last{' '}
                    {prettyMs(elapsedMs(uploadState.updated), {compact: true})} and likely got
                    interrupted.
                  </Text>
                </Box>
              </>
            )}
            {!stalled && (
              <Box flex={1}>
                <Text muted size={1}>
                  {completed && !stalled && <>Complete</>}
                  {!completed && !stalled && (
                    <>
                      Uploading
                      {filename ? (
                        <>
                          {' '}
                          <code>{filename}</code>
                        </>
                      ) : (
                        <>…</>
                      )}
                    </>
                  )}
                </Text>
              </Box>
            )}

            <Box marginTop={1}>
              {isUploading && (
                <Button
                  mode="bleed"
                  color="danger"
                  onClick={this.handleCancelUpload}
                  text="Cancel"
                />
              )}
              {!isUploading && stalled && (
                <Button
                  fontSize={1}
                  mode="bleed"
                  onClick={this.handleClearUploadState}
                  icon={CloseIcon}
                  text="Reset"
                />
              )}
            </Box>
          </Flex>
        </Box>
      </Flex>
    )
  }

  handleFieldChange = (event: PatchEvent, field: Field) => {
    const {onChange, type} = this.props
    onChange(
      event.prefixAll(field.name).prepend(
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
        id={this.dialogId}
        header={<>Edit details</>}
        width={1}
        onClose={this.handleStopAdvancedEdit}
      >
        <PresenceOverlay margins={[0, 0, 1, 0]}>
          <Box padding={4}>{this.renderFields(fields)}</Box>
        </PresenceOverlay>
      </Dialog>
    )
  }

  // eslint-disable-next-line class-methods-use-this
  renderSelectFileButton() {
    // Single asset source (just a normal button)
    // @todo add select handling here
    return <Button mode="bleed" text="Select" />
  }

  renderFields(fields: Field[]) {
    return fields.map((field) => this.renderField(field))
  }

  handleFileTargetFocus = () => {
    this.setState({
      hasFileTargetFocus: true,
    })
    this.props.onFocus(['asset'])
  }
  handleFileTargetBlur = () => {
    this.setState({
      hasFileTargetFocus: false,
    })
    this.props.onBlur()
  }
  handleFileTargetDragEnter = () => {
    this.setState({
      isDraggingOver: true,
    })
  }
  handleFileTargetDragLeave = () => {
    this.setState({
      isDraggingOver: false,
    })
  }

  renderField(field: Field) {
    const {value, level, focusPath, onFocus, readOnly, onBlur, presence} = this.props
    const fieldValue = value && value[field.name]
    return (
      <FormBuilderInput
        key={field.name}
        value={fieldValue}
        type={field.type}
        onChange={(ev) => this.handleFieldChange(ev, field)}
        path={[field.name]}
        onFocus={onFocus}
        onBlur={onBlur}
        readOnly={Boolean(readOnly || field.type.readOnly)}
        focusPath={focusPath}
        level={level}
        presence={presence}
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
    const {hasFileTargetFocus} = this.state

    return readOnly ? (
      <span>Field is read only</span>
    ) : (
      <UploadPlaceholder canPaste={hasFileTargetFocus} />
    )
  }

  focus() {
    if (this._focusArea) {
      this._focusArea.focus()
    }
  }

  setFocusArea = (el: any | null) => {
    this._focusArea = el
  }

  getUploadOptions = (file: globalThis.File): ResolvedUploader[] => {
    const {type, resolveUploader} = this.props
    const uploader = resolveUploader && resolveUploader(type, file)
    return uploader ? [{type: type, uploader}] : []
  }

  handleUpload = ({file, uploader}) => {
    this.uploadWith(uploader, file)
  }

  setToast = (toast: {push: (params: ToastParams) => void}) => {
    this.toast = toast
  }

  render() {
    const {type, value, compareValue, level, markers, readOnly, presence} = this.props
    const {isAdvancedEditOpen, isDraggingOver} = this.state
    const [highlightedFields, otherFields] = partition(
      type.fields.filter((field) => !HIDDEN_FIELDS.includes(field.name)),
      'type.options.isHighlighted'
    )
    const accept = get(type, 'options.accept', '')
    const hasAsset = value && value.asset

    // Whoever is present at the asset field is who we show on the field itself
    const assetFieldPresence = presence.filter((item) => item.path[0] === 'asset')

    return (
      <>
        <ImperativeToast ref={this.setToast} />

        <FormFieldSet
          markers={markers}
          title={type.title}
          description={type.description}
          level={level}
          presence={assetFieldPresence}
          changeIndicator={false}
        >
          <div>
            <Box>
              <ChangeIndicatorCompareValueProvider
                value={value?.asset?._ref}
                compareValue={compareValue?.asset?._ref}
              >
                <ChangeIndicatorWithProvidedFullPath
                  path={['asset']}
                  hasFocus={this.state.hasFileTargetFocus}
                  value={value?.asset}
                  compareValue={compareValue?.asset}
                >
                  <FileTarget
                    border
                    tabIndex={0}
                    disabled={Boolean(readOnly)}
                    ref={this.setFocusArea}
                    onFiles={this.handleSelectFiles}
                    onFocus={this.handleFileTargetFocus}
                    onBlur={this.handleFileTargetBlur}
                    onDragEnter={this.handleFileTargetDragEnter}
                    onDragLeave={this.handleFileTargetDragLeave}
                  >
                    <AssetBackground align="center" justify="center">
                      {!readOnly && isDraggingOver && <Overlay>Drop top upload</Overlay>}
                      {value?._upload
                        ? this.renderUploadState(value._upload)
                        : value?.asset
                        ? this.renderAsset()
                        : this.renderUploadPlaceholder()}
                    </AssetBackground>
                  </FileTarget>
                </ChangeIndicatorWithProvidedFullPath>
              </ChangeIndicatorCompareValueProvider>
            </Box>
            <Grid gap={1} columns={3} marginTop={3}>
              {!readOnly && (
                <FileInputButton
                  onSelect={this.handleSelectFileList}
                  mode="ghost"
                  icon={UploadIcon}
                  accept={accept}
                  text="Upload"
                />
              )}
              {/* Enable when selecting already uploaded files is possible */}
              {/* {!readOnly && this.renderSelectFileButton()} */}
              {value && otherFields.length > 0 && (
                <Button
                  icon={readOnly ? EyeOpenIcon : EditIcon}
                  mode="ghost"
                  title={readOnly ? 'View details' : 'Edit details'}
                  onClick={this.handleStartAdvancedEdit}
                  text={readOnly ? 'View details' : 'Edit'}
                />
              )}
              {!readOnly && hasAsset && (
                <Button
                  tone="critical"
                  mode="ghost"
                  onClick={this.handleRemoveButtonClick}
                  text="Remove"
                />
              )}
              {isAdvancedEditOpen && this.renderAdvancedEdit(otherFields)}
            </Grid>
          </div>
          {highlightedFields.length > 0 && this.renderFields(highlightedFields)}
        </FormFieldSet>
      </>
    )
  }
}
