/* eslint-disable import/no-unresolved,react/jsx-handler-names, react/display-name, react/no-this-in-sfc */

import React, {ReactNode} from 'react'
import {Observable, Subscription} from 'rxjs'
import {get, startCase} from 'lodash'
import {
  AssetFromSource,
  AssetSource,
  File as BaseFile,
  FileAsset,
  FileSchemaType,
  Path,
  UploadState,
} from '@sanity/types'
import {ImageIcon, SearchIcon} from '@sanity/icons'
import {Box, Card, Menu, MenuButton, ThemeColorToneKey, ToastParams} from '@sanity/ui'
import {SanityClient} from '@sanity/client'
import {isFileSource} from '@sanity/asset-utils'
import {WithReferencedAsset} from '../../../utils/WithReferencedAsset'
import {Button, MenuItem} from '../../../../../ui'
import {Uploader, UploaderResolver, UploadOptions} from '../../../studio/uploads/types'
import {FileInfo, FileTarget} from '../common/styles'
import {UploadProgress} from '../common/UploadProgress'
import {handleSelectAssetFromSource} from '../common/assetSource'
import {ActionsMenu} from '../common/ActionsMenu'
import {PlaceholderText} from '../common/PlaceholderText'
import {UploadPlaceholder} from '../common/UploadPlaceholder'
import {UploadWarning} from '../common/UploadWarning'
import {InputProps, ObjectInputProps} from '../../../types'
import {PatchEvent, setIfMissing, unset} from '../../../patch'
import {MemberField, MemberFieldError, MemberFieldSet} from '../../../members'
import {ImperativeToast} from '../../../../components'
import {ChangeIndicator} from '../../../../changeIndicators'
import {CardOverlay, FlexContainer} from './styles'
import {FileActionsMenu} from './FileActionsMenu'
import {FileSkeleton} from './FileSkeleton'
import {InvalidFileWarning} from './InvalidFileWarning'

/**
 * @hidden
 * @beta */
export interface BaseFileInputValue extends Partial<BaseFile> {
  _upload?: UploadState
}

function passThrough({children}: {children?: React.ReactNode}) {
  return children
}

/**
 * @hidden
 * @beta */
export interface BaseFileInputProps extends ObjectInputProps<BaseFileInputValue, FileSchemaType> {
  assetSources: AssetSource[]
  directUploads?: boolean
  observeAsset: (documentId: string) => Observable<FileAsset>
  resolveUploader: UploaderResolver
  client: SanityClient
  t: (key: string, values?: Record<string, string>) => string
}

/** @internal */
export interface BaseFileInputState {
  isUploading: boolean
  selectedAssetSource: AssetSource | null
  hoveringFiles: FileInfo[]
  isStale: boolean
  isMenuOpen: boolean
}

const ASSET_FIELD_PATH = ['asset']

/** @internal */
export class BaseFileInput extends React.PureComponent<BaseFileInputProps, BaseFileInputState> {
  _assetFieldPath: Path
  uploadSubscription: Subscription | null = null
  browseButtonElement: HTMLButtonElement | null = null

  state: BaseFileInputState = {
    isUploading: false,
    selectedAssetSource: null,
    hoveringFiles: [],
    isStale: false,
    isMenuOpen: false,
  }

  constructor(props: BaseFileInputProps) {
    super(props)
    this._assetFieldPath = props.path.concat(ASSET_FIELD_PATH)
  }

  toast: {push: (params: ToastParams) => void} | null = null

  handleRemoveButtonClick = () => {
    const {path, value} = this.props
    const parentPathSegment = path.slice(-1)[0]

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
      (key) => !['_type', '_key', '_upload', 'asset'].includes(key),
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
    this.props.onChange(unset(['asset']))
  }

  handleSelectFiles = (files: globalThis.File[]) => {
    const {directUploads, readOnly} = this.props
    const {hoveringFiles} = this.state
    if (directUploads && !readOnly) {
      this.uploadFirstAccepted(files)
    } else if (hoveringFiles.length > 0) {
      this.handleFilesOut()
    }
  }

  handleSelectFileFromAssetSource = (source: AssetSource) => {
    this.setState({selectedAssetSource: source})
  }

  handleAssetSourceClosed = () => {
    this.setState({selectedAssetSource: null})

    // Restore focus to browse button when closing the dialog
    this.browseButtonElement?.focus()
  }

  setBrowseButtonElement = (el: HTMLButtonElement | null) => {
    this.browseButtonElement = el
  }

  uploadFirstAccepted(files: globalThis.File[]) {
    const {schemaType} = this.props

    const match = files
      .map((file) => ({file, uploader: this.props.resolveUploader?.(schemaType, file)}))
      .find((result) => result.uploader)

    if (match) {
      this.uploadWith(match.uploader!, match.file)
    }

    this.setState({isMenuOpen: false})
  }

  uploadWith = (
    uploader: Uploader,
    file: globalThis.File,
    assetDocumentProps: UploadOptions = {},
  ) => {
    const {schemaType, onChange, client, t} = this.props
    const {source} = assetDocumentProps
    const options = {
      metadata: get(schemaType, 'options.metadata'),
      storeOriginalFilename: get(schemaType, 'options.storeOriginalFilename'),
      source,
    }
    this.cancelUpload()
    this.setState({isUploading: true})
    onChange(PatchEvent.from([setIfMissing({_type: schemaType.name})]))
    this.uploadSubscription = uploader.upload(client, file, schemaType, options).subscribe({
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
          description: t('inputs.file.upload-failed.description'),
          title: t('inputs.file.upload-failed.title'),
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
    const {value, schemaType, observeAsset, t} = this.props
    if (!selectedAssetSource) {
      return null
    }
    const accept = get(schemaType, 'options.accept', '')

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
              accept={accept}
              dialogHeaderTitle={t('inputs.file.dialog.title')}
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
        accept={accept}
        dialogHeaderTitle={t('inputs.file.dialog.title')}
        onClose={this.handleAssetSourceClosed}
        onSelect={this.handleSelectAssetFromSource}
      />
    )
  }

  handleSelectAssetFromSource = (assetFromSource: AssetFromSource[]) => {
    const {onChange, schemaType, resolveUploader} = this.props
    handleSelectAssetFromSource({
      assetFromSource,
      onChange,
      type: schemaType,
      resolveUploader,
      uploadWith: this.uploadWith,
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

  renderAsset() {
    const {value, changed, readOnly, elementProps} = this.props
    const {hoveringFiles, isStale} = this.state
    const hasValueOrUpload = Boolean(value?._upload || value?.asset)

    if (value && typeof value.asset !== 'undefined' && !value?._upload && !isFileSource(value)) {
      return () => <InvalidFileWarning onClearValue={this.handleClearField} />
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
          path={this._assetFieldPath}
          hasFocus={!!inputProps.focused}
          isChanged={changed}
        >
          {/* not uploading */}
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
              <div style={{position: 'relative'}}>
                {!value?.asset && this.renderUploadPlaceholder()}
                {value?.asset && hoveringFiles.length > 0
                  ? this.renderAssetMenu(this.getFileTone())
                  : null}
                {!value?._upload && value?.asset && this.renderPreview()}
              </div>
            </FileTarget>
          )}
        </ChangeIndicator>
      </>
    )
  }

  renderPreview() {
    const {value, readOnly, assetSources, schemaType, directUploads, observeAsset, t} = this.props
    const {isMenuOpen} = this.state
    const asset = value?.asset
    if (!asset) {
      return null
    }

    const accept = get(schemaType, 'options.accept', '')

    let browseMenuItem: ReactNode =
      assetSources && assetSources?.length === 0 ? null : (
        <MenuItem
          icon={SearchIcon}
          text={t('inputs.file.browse-button.text')}
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
            text={
              (assetSource.i18nKey ? t(assetSource.i18nKey) : assetSource.title) ||
              startCase(assetSource.name)
            }
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
        {({originalFilename, extension, url, size}) => {
          const filename = originalFilename || `download.${extension}`
          let copyUrl: string | undefined
          let downloadUrl: string | undefined

          if (isFileSource(value)) {
            downloadUrl = `${url}?dl`
            copyUrl = url
          }

          return (
            <FileActionsMenu
              size={size}
              originalFilename={filename}
              muted={!readOnly}
              onMenuOpen={(isOpen) => this.setState({isMenuOpen: isOpen})}
              isMenuOpen={isMenuOpen}
              setMenuButtonElement={this.setBrowseButtonElement}
            >
              <ActionsMenu
                onUpload={this.handleSelectFiles}
                browse={browseMenuItem}
                onReset={this.handleRemoveButtonClick}
                downloadUrl={downloadUrl}
                copyUrl={copyUrl}
                readOnly={readOnly}
                accept={accept}
                directUploads={directUploads}
              />
            </FileActionsMenu>
          )
        }}
      </WithReferencedAsset>
    )
  }

  renderAssetMenu(tone: ThemeColorToneKey) {
    const {schemaType, readOnly, directUploads, resolveUploader} = this.props
    const {hoveringFiles} = this.state

    const acceptedFiles = hoveringFiles.filter((file) => resolveUploader?.(schemaType, file))
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
            type="file"
          />
        </FlexContainer>
      </CardOverlay>
    )
  }

  renderBrowser() {
    const {assetSources, readOnly, directUploads, id, t} = this.props

    if (assetSources.length === 0) return null

    if (assetSources.length > 1 && !readOnly && directUploads) {
      return (
        <MenuButton
          id={`${id}_assetFileButton`}
          ref={this.setBrowseButtonElement}
          button={
            <Button
              mode="ghost"
              text={t('inputs.file.multi-browse-button.text')}
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
        text={t('inputs.file.browse-button.text')}
        icon={SearchIcon}
        mode="ghost"
        onClick={() => {
          this.setState({isMenuOpen: false})
          this.handleSelectFileFromAssetSource(assetSources[0])
        }}
        data-testid="file-input-browse-button"
        disabled={readOnly}
        ref={this.setBrowseButtonElement}
      />
    )
  }

  renderUploadPlaceholder() {
    const {readOnly, schemaType, directUploads, resolveUploader} = this.props
    const {hoveringFiles} = this.state

    const acceptedFiles = hoveringFiles.filter((file) => resolveUploader?.(schemaType, file))
    const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length

    const accept = get(schemaType, 'options.accept', '')

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

  handleUpload = ({file, uploader}: {file: globalThis.File; uploader: Uploader}) => {
    this.uploadWith(uploader, file)
  }

  setToast = (toast: {push: (params: ToastParams) => void}) => {
    this.toast = toast
  }
  getFileTone() {
    const {directUploads, schemaType, value, readOnly, resolveUploader} = this.props
    const {hoveringFiles} = this.state

    const acceptedFiles = hoveringFiles.filter((file) => resolveUploader?.(schemaType, file))
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

  render() {
    const {
      members,
      renderAnnotation,
      renderBlock,
      renderInlineBlock,
      renderItem,
      renderInput,
      renderField,
      renderPreview,
      t,
    } = this.props
    const {selectedAssetSource} = this.state

    return (
      <>
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
                renderInlineBlock={renderInlineBlock}
                renderBlock={renderBlock}
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
          return <>{t('inputs.file.error.unknown-member-kind', {kind: member.kind})}</>
        })}
        {selectedAssetSource && this.renderAssetSource()}
      </>
    )
  }
}
