/* eslint-disable complexity */
import PropTypes from 'prop-types'
// Connects the FormBuilder with various sanity roles
import React from 'react'
import Spinner from 'part:@sanity/components/loading/spinner'
import Button from 'part:@sanity/components/buttons/default'
import FormBuilder from 'part:@sanity/form-builder'
import {withRouterHOC} from 'part:@sanity/base/router'
import TrashIcon from 'part:@sanity/base/trash-icon'
import UndoIcon from 'part:@sanity/base/undo-icon'
import PublicIcon from 'part:@sanity/base/public-icon'
import VisibilityOffIcon from 'part:@sanity/base/visibility-off-icon'
import BinaryIcon from 'part:@sanity/base/binary-icon'
import Menu from 'part:@sanity/components/menus/default'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'
import documentStore from 'part:@sanity/base/datastore/document'
import schema from 'part:@sanity/base/schema'
import {debounce} from 'lodash'
import {PreviewFields} from 'part:@sanity/base/preview'
import Pane from 'part:@sanity/components/panes/default'
import afterEditorComponents from 'all:part:@sanity/desk-tool/after-editor-component'
import SyncIcon from 'part:@sanity/base/sync-icon'
import CheckIcon from 'part:@sanity/base/check-icon'
import CheckCircleIcon from 'part:@sanity/base/circle-check-icon'
import Snackbar from 'part:@sanity/components/snackbar/default'
import resolveProductionPreviewUrl from 'part:@sanity/transitional/production-preview/resolve-production-url?'
import ValidationList from 'part:@sanity/components/validation/list'
import {Tooltip} from '@sanity/react-tippy'
import ChevronDown from 'part:@sanity/base/chevron-down-icon'
import WarningIcon from 'part:@sanity/base/warning-icon'
import ConfirmDiscard from '../components/ConfirmDiscard'
import ConfirmDelete from '../components/ConfirmDelete'
import ConfirmUnpublish from '../components/ConfirmUnpublish'
import InspectView from '../components/InspectView'
import copyDocument from '../utils/copyDocument'
import {getPublishedId, newDraftFrom} from 'part:@sanity/base/util/draft-utils'
import TimeAgo from '../components/TimeAgo'
import styles from './styles/Editor.css'
import DocTitle from '../components/DocTitle'

function navigateUrl(url) {
  window.open(url)
}

const preventDefault = ev => ev.preventDefault()

// Want a nicer api for listen/unlisten
function listen(target, eventType, callback, useCapture = false) {
  target.addEventListener(eventType, callback, useCapture)
  return function unlisten() {
    target.removeEventListener(eventType, callback, useCapture)
  }
}

const getDuplicateItem = (draft, published) => ({
  action: 'duplicate',
  title: 'Duplicate',
  icon: ContentCopyIcon,
  divider: true,
  isDisabled: !draft && !published
})

const getDiscardItem = (draft, published, isLiveEditEnabled) =>
  isLiveEditEnabled
    ? null
    : {
        action: 'discard',
        title: 'Discard changes…',
        icon: UndoIcon,
        divider: true,
        isDisabled: !draft || !published
      }

const getUnpublishItem = (draft, published, isLiveEditEnabled) =>
  isLiveEditEnabled
    ? null
    : {
        action: 'unpublish',
        title: 'Unpublish…',
        icon: VisibilityOffIcon,
        divider: true,
        isDisabled: !published
      }

const getDeleteItem = (draft, published) => ({
  action: 'delete',
  title: 'Delete…',
  icon: TrashIcon,
  divider: true,
  danger: true,
  isDisabled: !draft && !published
})

const getInspectItem = (draft, published) => ({
  action: 'inspect',
  title: (
    <span>
      Inspect <code className={styles.hotkey}>Ctrl+Alt+I</code>
    </span>
  ),
  icon: BinaryIcon,
  divider: true,
  isDisabled: !(draft || published)
})

const getProductionPreviewItem = (draft, published) => {
  const snapshot = draft || published
  if (!snapshot || !resolveProductionPreviewUrl) {
    return null
  }
  let previewUrl
  try {
    previewUrl = resolveProductionPreviewUrl(snapshot)
  } catch (error) {
    error.message = `An error was thrown while trying to get production preview url: ${
      error.message
    }`
    // eslint-disable-next-line no-console
    console.error(error)
    return null
  }

  return (
    previewUrl && {
      action: 'production-preview',
      title: (
        <span>
          Open preview <code className={styles.hotkey}>Ctrl+Alt+O</code>
        </span>
      ),
      icon: PublicIcon,
      url: previewUrl
    }
  )
}

const getMenuItems = (draft, published, isLiveEditEnabled) =>
  [
    getProductionPreviewItem,
    getDiscardItem,
    getUnpublishItem,
    getDuplicateItem,
    getDeleteItem,
    getInspectItem
  ]
    .map(fn => fn(draft, published, isLiveEditEnabled))
    .filter(Boolean)

const isValidationError = marker => marker.type === 'validation' && marker.level === 'error'

const INITIAL_STATE = {
  inspect: false,
  isMenuOpen: false,
  isCreatingDraft: false,
  showSavingStatus: false,
  showConfirmDiscard: false,
  showConfirmDelete: false,
  showConfirmUnpublish: false,
  showValidationTooltip: false,
  focusPath: []
}

export default withRouterHOC(
  class Editor extends React.PureComponent {
    static propTypes = {
      patchChannel: PropTypes.object,
      draft: PropTypes.object,
      published: PropTypes.object,
      type: PropTypes.object.isRequired,
      markers: PropTypes.arrayOf(
        PropTypes.shape({
          path: PropTypes.array
        })
      ),
      router: PropTypes.shape({
        state: PropTypes.object
      }).isRequired,

      onDelete: PropTypes.func,
      onCreate: PropTypes.func,
      onChange: PropTypes.func,
      onDiscardDraft: PropTypes.func,
      onPublish: PropTypes.func,
      onUnpublish: PropTypes.func,
      transactionResult: PropTypes.shape({type: PropTypes.string}),
      onClearTransactionResult: PropTypes.func,

      validationPending: PropTypes.bool,
      isCreatingDraft: PropTypes.bool,
      isUnpublishing: PropTypes.bool,
      isPublishing: PropTypes.bool,
      isReconnecting: PropTypes.bool,
      isLoading: PropTypes.bool,
      isSaving: PropTypes.bool,
      deletedSnapshot: PropTypes.object
    }

    static defaultProps = {
      markers: [],
      isLoading: false,
      isSaving: false,
      isUnpublishing: false,
      isPublishing: false,
      isReconnecting: false,
      isCreatingDraft: false,
      deletedSnapshot: null,
      transactionResult: null,
      onDelete() {},
      onCreate() {},
      onChange() {},
      onClearTransactionResult() {}
    }

    state = INITIAL_STATE

    componentDidMount() {
      this.unlistenForKey = listen(window, 'keyup', event => {
        if (event.code === 'Escape' && this.state.showValidationTooltip) {
          this.setState({showValidationTooltip: false})
          return
        }

        if (event.ctrlKey && event.code === 'KeyI' && event.altKey && !event.shiftKey) {
          this.setState(prevState => ({inspect: !prevState.inspect}))
          return
        }

        if (event.ctrlKey && event.code === 'KeyP' && event.altKey && !event.shiftKey) {
          this.handlePublishRequested()
          return
        }

        if (event.ctrlKey && event.code === 'KeyO' && event.altKey && !event.shiftKey) {
          const {draft, published} = this.props
          const item = getProductionPreviewItem(draft || published)
          if (item && item.url) {
            navigateUrl(item.url)
          }
        }
      })
    }

    componentWillUnmount() {
      this.unlistenForKey()
      this.setSavingStatus.cancel()
    }

    componentWillReceiveProps(nextProps) {
      this.setState({didPublish: this.props.isPublishing && !nextProps.isPublishing})

      if (this.props.isSaving && !nextProps.isSaving) {
        this.setState({
          showSavingStatus: true
        })
        this.setSavingStatus()
      }
    }

    setSavingStatus = debounce(
      () => {
        this.setState({
          showSavingStatus: false
        })
      },
      1500,
      {trailing: true}
    )

    handleFocus = path => {
      this.setState({focusPath: path})
    }

    handleBlur = () => {
      // do nothing
    }

    handleCreateCopy = () => {
      const {router, draft, published} = this.props
      documentStore.create(newDraftFrom(copyDocument(draft || published))).subscribe(copied => {
        router.navigate({
          ...router.state,
          action: 'edit',
          selectedDocumentId: getPublishedId(copied._id)
        })
      })
    }

    handleEditAsActualType = () => {
      const {router, draft, published} = this.props
      const actualTypeName = draft._type || published._type
      router.navigate({
        ...router.state,
        selectedType: actualTypeName,
        action: 'edit'
      })
    }

    handleChange = changeEvent => {
      const {onChange} = this.props
      onChange(changeEvent)
    }

    handleRestore = () => {
      const {deletedSnapshot} = this.props
      this.props.onCreate(deletedSnapshot)
    }

    handleMenuToggle = evt => {
      evt.stopPropagation()
      this.setState(prevState => ({isMenuOpen: !prevState.isMenuOpen}))
    }

    handleMenuClose = evt => {
      evt.stopPropagation()
      this.setState({isMenuOpen: false})
    }

    handlePublishRequested = () => {
      const {markers, validationPending, onPublish, draft} = this.props
      if (!draft) {
        return
      }
      const errors = markers.filter(isValidationError)
      const hasErrors = errors.length > 0

      if (validationPending || hasErrors) {
        this.setState(prevState => ({
          showValidationTooltip: !prevState.showValidationTooltip
        }))
        return
      }

      onPublish(draft)
    }

    handleCancelUnpublish = () => {
      this.setState({showConfirmUnpublish: false})
    }

    handleCancelDelete = () => {
      this.setState({showConfirmDelete: false})
    }

    handleCancelDiscard = () => {
      this.setState({showConfirmDiscard: false})
    }

    handleConfirmUnpublish = () => {
      const {onUnpublish} = this.props
      onUnpublish()
      this.setState({showConfirmUnpublish: false})
    }

    handleConfirmDiscard = () => {
      const {onDiscardDraft, draft} = this.props
      onDiscardDraft(draft)
      this.setState({showConfirmDiscard: false})
    }

    handleConfirmDelete = () => {
      const {onDelete, onDiscardDraft, published} = this.props
      if (published) {
        onDelete()
      } else {
        onDiscardDraft()
      }
      this.setState({showConfirmDelete: false})
    }

    handleHideInspector = () => {
      this.setState({inspect: false})
    }

    handleMenuClick = item => {
      if (item.action === 'production-preview') {
        navigateUrl(item.url)
      }

      if (item.action === 'delete') {
        this.setState({showConfirmDelete: true})
      }

      if (item.action === 'discard') {
        this.setState({showConfirmDiscard: true})
      }

      if (item.action === 'unpublish') {
        this.setState({showConfirmUnpublish: true})
      }

      if (item.action === 'duplicate') {
        this.handleCreateCopy()
      }

      if (item.action === 'inspect') {
        this.setState({inspect: true})
      }

      this.setState({isMenuOpen: false})
    }

    handleCloseValidationResults = () => {
      this.setState({showValidationTooltip: false})
    }

    handleToggleValidationResults = () => {
      this.setState(prevState => ({showValidationTooltip: !prevState.showValidationTooltip}))
    }

    isLiveEditEnabled() {
      const selectedSchemaType = schema.get(this.props.type.name)
      return selectedSchemaType.liveEdit === true
    }

    getTitle(value) {
      const {type} = this.props
      if (!value) {
        return `Creating new ${type.title || type.name}`
      }
      return (
        <PreviewFields document={value} type={type} fields={['title']}>
          {({title}) => <span>{title}</span>}
        </PreviewFields>
      )
    }

    renderFunctions = () => {
      const {draft, published, markers, type, isReconnecting} = this.props
      const {showSavingStatus, showValidationTooltip} = this.state

      const value = draft || published

      const validation = markers.filter(marker => marker.type === 'validation')
      const errors = validation.filter(marker => marker.level === 'error')
      const warnings = validation.filter(marker => marker.level === 'warning')

      return (
        <div className={styles.paneFunctions}>
          {showSavingStatus && (
            <Tooltip
              className={styles.syncStatusSyncing}
              arrow
              theme="light"
              size="small"
              distance="0"
              title="Syncing your content with the Sanity cloud"
            >
              <span className={styles.syncSpinnerContainer}>
                <span className={styles.syncSpinner}>
                  <SyncIcon />
                </span>
                &nbsp;Syncing…
              </span>
            </Tooltip>
          )}
          {isReconnecting && (
            <Tooltip
              className={styles.syncStatusReconnecting}
              arrow
              theme="light"
              size="small"
              distance="0"
              title="Connection lost. Reconnecting…"
            >
              <span className={styles.syncSpinnerContainer}>
                <span className={styles.syncSpinner}>
                  <SyncIcon />
                </span>
                &nbsp;Reconnecting…
              </span>
            </Tooltip>
          )}
          {value &&
            !showSavingStatus &&
            !isReconnecting && (
              <Tooltip
                className={styles.syncStatusSynced}
                arrow
                theme="light"
                size="small"
                distance="0"
                title="Synced with the Sanity cloud"
              >
                <CheckIcon /> Synced
              </Tooltip>
            )}
          {(errors.length > 0 || warnings.length > 0) && (
            <Tooltip
              arrow
              theme="light noPadding"
              trigger="click"
              position="bottom"
              interactive
              duration={100}
              open={showValidationTooltip}
              onRequestClose={this.handleCloseValidationResults}
              style={{padding: 0}}
              html={
                <ValidationList
                  markers={validation}
                  showLink
                  isOpen={showValidationTooltip}
                  documentType={type}
                  onClose={this.handleCloseValidationResults}
                  onFocus={this.handleFocus}
                />
              }
            >
              <Button
                color="danger"
                icon={WarningIcon}
                padding="small"
                onClick={this.handleToggleValidationResults}
              >
                {errors.length}
                <span style={{paddingLeft: '0.5em'}}>
                  <ChevronDown />
                </span>
              </Button>
            </Tooltip>
          )}
          {!this.isLiveEditEnabled() && (
            <Tooltip
              arrow
              theme="light"
              className={styles.publishButton}
              title={errors.length > 0 ? 'Fix errors before publishing' : 'Ctrl+Alt+P'}
            >
              <Button
                disabled={isReconnecting || !draft || errors.length > 0}
                onClick={this.handlePublishRequested}
                color="primary"
              >
                {published ? 'Publish changes' : 'Publish'}
              </Button>
            </Tooltip>
          )}
        </div>
      )
    }

    renderMenu = () => {
      const {draft, published} = this.props
      return (
        <Menu
          onAction={this.handleMenuClick}
          isOpen={this.state.isMenuOpen}
          onClose={this.handleMenuClose}
          onClickOutside={this.handleMenuClose}
          items={getMenuItems(draft, published, this.isLiveEditEnabled())}
          origin="top-right"
        />
      )
    }

    render() {
      const {
        draft,
        markers,
        published,
        type,
        isLoading,
        isPublishing,
        isUnpublishing,
        isCreatingDraft,
        isReconnecting,
        patchChannel,
        transactionResult,
        onClearTransactionResult
      } = this.props

      const {
        inspect,
        focusPath,
        showConfirmDelete,
        showConfirmDiscard,
        showConfirmUnpublish,
        didPublish
      } = this.state

      const value = draft || published

      if (isLoading) {
        return (
          <div className={styles.root}>
            <Spinner center message={`Loading ${type.title}…`} />
          </div>
        )
      }

      const hasTypeMismatch = value && value._type && value._type !== type.name
      if (hasTypeMismatch) {
        return (
          <div className={styles.typeMisMatchMessage}>
            This document is of type <code>{value._type}</code> and cannot be edited as{' '}
            <code>{type.name}</code>
            <div>
              <Button onClick={this.handleEditAsActualType}>Edit as {value._type} instead</Button>
            </div>
          </div>
        )
      }

      return (
        <Pane
          title={this.getTitle(value)}
          renderMenu={this.renderMenu}
          renderFunctions={this.renderFunctions}
          onMenuToggle={this.handleMenuToggle}
          isSelected // last pane is always selected for now
        >
          <div className={styles.root}>
            {(isCreatingDraft || isPublishing || isUnpublishing) && (
              <div className={styles.spinnerContainer}>
                {isCreatingDraft && <Spinner center message="Making changes…" />}
                {isPublishing && <Spinner center message="Publishing…" />}
                {isUnpublishing && <Spinner center message="Unpublishing…" />}
              </div>
            )}
            <div className={styles.top}>
              <div className={styles.editedDate}>
                {value && (
                  <span>
                    Edited <TimeAgo time={value._updatedAt} />
                  </span>
                )}
              </div>
              {!this.isLiveEditEnabled() && (
                <div className={styles.publishedDate}>
                  {published ? (
                    <span>
                      Published <TimeAgo time={published._updatedAt} />
                    </span>
                  ) : (
                    'Not published'
                  )}
                </div>
              )}
            </div>
            <form
              className={styles.editor}
              onSubmit={preventDefault}
              id="Sanity_Default_DeskTool_Editor_ScrollContainer"
            >
              <FormBuilder
                schema={schema}
                patchChannel={patchChannel}
                value={draft || published || {_type: type.name}}
                type={type}
                readOnly={isReconnecting}
                onBlur={this.handleBlur}
                onFocus={this.handleFocus}
                focusPath={focusPath}
                onChange={this.handleChange}
                markers={markers}
              />
            </form>
            {afterEditorComponents.map((AfterEditorComponent, i) => (
              <AfterEditorComponent key={i} documentId={published._id} />
            ))}

            {inspect && <InspectView value={value} onClose={this.handleHideInspector} />}
            {showConfirmDiscard && (
              <ConfirmDiscard
                draft={draft}
                published={published}
                onCancel={this.handleCancelDiscard}
                onConfirm={this.handleConfirmDiscard}
              />
            )}
            {showConfirmDelete && (
              <ConfirmDelete
                draft={draft}
                published={published}
                onCancel={this.handleCancelDelete}
                onConfirm={this.handleConfirmDelete}
              />
            )}
            {showConfirmUnpublish && (
              <ConfirmUnpublish
                draft={draft}
                published={published}
                onCancel={this.handleCancelUnpublish}
                onConfirm={this.handleConfirmUnpublish}
              />
            )}
            {isReconnecting && (
              <Snackbar kind="warning">
                <WarningIcon /> Connection lost. Reconnecting…
              </Snackbar>
            )}
            {didPublish && (
              <Snackbar kind="success" timeout={4}>
                <CheckCircleIcon /> You just published{' '}
                <em>
                  <DocTitle document={draft || published} />
                </em>
              </Snackbar>
            )}
            {transactionResult &&
              transactionResult.type === 'error' && (
                <Snackbar
                  kind="danger"
                  action={{title: 'Ok, got it'}}
                  onAction={onClearTransactionResult}
                >
                  <div>
                    {transactionResult.message}
                    <details>{transactionResult.error.message}</details>
                  </div>
                </Snackbar>
              )}
          </div>
        </Pane>
      )
    }
  }
)
