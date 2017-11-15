import PropTypes from 'prop-types'
// Connects the FormBuilder with various sanity roles
import React from 'react'
import Spinner from 'part:@sanity/components/loading/spinner'
import Button from 'part:@sanity/components/buttons/default'
import FormBuilder from 'part:@sanity/form-builder'
import ConfirmPublish from '../components/ConfirmPublish'
import ConfirmDiscard from '../components/ConfirmDiscard'
import ConfirmDelete from '../components/ConfirmDelete'
import ConfirmUnpublish from '../components/ConfirmUnpublish'
import InspectView from '../components/InspectView'
import {withRouterHOC} from 'part:@sanity/base/router'
import TrashIcon from 'part:@sanity/base/trash-icon'
import UndoIcon from 'part:@sanity/base/undo-icon'
import VisibilityOffIcon from 'part:@sanity/base/visibility-off-icon'
import BinaryIcon from 'part:@sanity/base/binary-icon'
import styles from './styles/Editor.css'
import copyDocument from '../utils/copyDocument'
import Menu from 'part:@sanity/components/menus/default'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'
import documentStore from 'part:@sanity/base/datastore/document'
import schema from 'part:@sanity/base/schema'
import {debounce} from 'lodash'
import {getPublishedId, newDraftFrom} from '../utils/draftUtils'
import TimeAgo from '../components/TimeAgo'
import {PreviewFields} from 'part:@sanity/base/preview'
import Pane from 'part:@sanity/components/panes/default'
import afterEditorComponents from 'all:part:@sanity/desk-tool/after-editor-component'
import SyncIcon from 'part:@sanity/base/sync-icon'
import CheckIcon from 'part:@sanity/base/check-icon'
import Snackbar from 'part:@sanity/components/snackbar/default'

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
  isDisabled: (!draft && !published)
})

const getDiscardItem = (draft, published) => ({
  action: 'discard',
  title: 'Discard changes…',
  icon: UndoIcon,
  isDisabled: !draft || !published
})

const getUnpublishItem = (draft, published) => ({
  action: 'unpublish',
  title: 'Unpublish…',
  icon: VisibilityOffIcon,
  divider: true,
  isDisabled: !published
})

const getDeleteItem = (draft, published) => ({
  action: 'delete',
  title: 'Delete…',
  icon: TrashIcon,
  divider: true,
  danger: true,
  isDisabled: (!draft && !published)
})

const getInspectItem = (draft, published) => ({
  action: 'inspect',
  title: <span>Inspect <code className={styles.hotkey}>Ctrl+Alt+I</code></span>,
  icon: BinaryIcon,
  divider: true,
  isDisabled: !(draft || published)
})

const getMenuItems = (draft, published) => ([getDiscardItem, getUnpublishItem, getDuplicateItem, getDeleteItem, getInspectItem])
  .map(fn => fn(draft, published))
  .filter(Boolean)

const INITIAL_STATE = {
  inspect: false,
  isMenuOpen: false,
  isCreatingDraft: false,
  showSavingStatus: false,
  showConfirmPublish: false,
  showConfirmDiscard: false,
  showConfirmDelete: false,
  showConfirmUnpublish: false
}

function getToggleKeyState(event) {
  if (event.ctrlKey
    && event.code === 'KeyI'
    && event.altKey
    && !event.shiftKey) {
    return 'inspect'
  }

  if (event.ctrlKey
    && event.code === 'KeyP'
    && event.altKey
    && !event.shiftKey) {
    return 'showConfirmPublish'
  }

  return undefined
}

export default withRouterHOC(class Editor extends React.PureComponent {
  static propTypes = {
    patchChannel: PropTypes.object,
    draft: PropTypes.object,
    published: PropTypes.object,
    type: PropTypes.object.isRequired,
    router: PropTypes.shape({
      state: PropTypes.object
    }).isRequired,

    onDelete: PropTypes.func,
    onCreate: PropTypes.func,
    onChange: PropTypes.func,
    onDiscardDraft: PropTypes.func,
    onPublish: PropTypes.func,
    onUnpublish: PropTypes.func,
    transactionResult: PropTypes.func,
    onClearTransactionResult: PropTypes.func,

    isCreatingDraft: PropTypes.bool,
    isUnpublishing: PropTypes.bool,
    isPublishing: PropTypes.bool,
    isLoading: PropTypes.bool,
    isSaving: PropTypes.bool,
    deletedSnapshot: PropTypes.object
  }

  static defaultProps = {
    isLoading: false,
    isSaving: false,
    isUnpublishing: false,
    isPublishing: false,
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
      const toggleKey = getToggleKeyState(event)
      if (toggleKey) {
        this.setState(prevState => ({[toggleKey]: !prevState[toggleKey]}))
      }
    })
  }

  componentWillUnmount() {
    this.unlistenForKey()
    this.setSavingStatus.cancel()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isSaving && !nextProps.isSaving) {
      this.setState({
        showSavingStatus: true
      })
      this.setSavingStatus()
    }
  }

  setSavingStatus = debounce(() => {
    this.setState({
      showSavingStatus: false
    })
  }, 1500, {trailing: true})

  handleCreateCopy = () => {
    const {router, draft, published} = this.props
    documentStore.create(newDraftFrom(copyDocument(draft || published))).subscribe(copied => {
      router.navigate({...router.state, action: 'edit', selectedDocumentId: getPublishedId(copied._id)})
    })
  }

  handleEditAsActualType = () => {
    const {router, draft, published} = this.props
    const actualTypeName = (draft._type || published._type)
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

  handleMenuToggle = () => {
    this.setState({
      isMenuOpen: !this.state.isMenuOpen
    })
  }

  handleMenuClose = () => {
    this.setState({
      isMenuOpen: false
    })
  }

  handlePublishButtonClick = () => {
    this.setState({showConfirmPublish: true})
  }

  handleCancelConfirmPublish = () => {
    this.setState({showConfirmPublish: false})
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

  handleConfirmPublish = () => {
    const {onPublish, draft} = this.props
    onPublish(draft)
    this.setState({showConfirmPublish: false})
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

  handleMenuClick = item => {
    if (item.action === 'delete') {
      this.setState({showConfirmDelete: true})
    }
    if (item.action === 'discard') {
      this.setState({showConfirmDiscard: true})
    }

    if (item.action === 'unpublish') {
      this.setState({showConfirmUnpublish: true})
    }

    if (item.action === 'publish') {
      this.setState({showConfirmPublish: true})
    }

    if (item.action === 'duplicate') {
      this.handleCreateCopy()
    }

    if (item.action === 'inspect') {
      this.setState({inspect: true})
    }

    this.setState({isMenuOpen: false})
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
    const {draft, published} = this.props
    const {
      showSavingStatus
    } = this.state

    const value = draft || published

    return (
      <div className={styles.paneFunctions}>
        {showSavingStatus && (
          <div className={styles.syncStatusSyncing}>
            <span className={styles.spinnerContainer}>
              <span className={styles.spinner}>
                <SyncIcon />
              </span>
            </span> Syncing…
          </div>
        )}
        {value && !showSavingStatus && (
          <div className={styles.syncStatusSynced}>
            <CheckIcon /> Synced
          </div>
        )}
        <div className={styles.publishButton}>
          <Button
            title="Ctrl+Alt+P"
            disabled={!draft}
            onClick={this.handlePublishButtonClick}
            color="primary"
          >
            {published ? 'Publish changes' : 'Publish'}
          </Button>
        </div>
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
        items={getMenuItems(draft, published)}
        origin="top-right"
      />
    )
  }

  render() {
    const {
      draft,
      published,
      type,
      isLoading,
      isPublishing,
      isUnpublishing,
      isCreatingDraft,
      patchChannel,
      transactionResult,
      onClearTransactionResult
    } = this.props

    const {
      inspect,
      showConfirmPublish,
      showConfirmDelete,
      showConfirmDiscard,
      showConfirmUnpublish
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
          This document is of type <code>{value._type}</code> and cannot be edited as <code>{type.name}</code>
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
      >
        <div className={styles.root}>
          {isCreatingDraft && (
            <Spinner fullscreen message="Making changes…" />
          )}
          {isPublishing && (
            <Spinner fullscreen message="Publishing…" />
          )}
          {isUnpublishing && (
            <Spinner fullscreen message="Unpublishing…" />
          )}
          <div className={styles.top}>
            <div className={styles.editedDate}>
              {value && <span>Edited <TimeAgo time={value._updatedAt} /></span>}
            </div>
            <div className={styles.publishedDate}>
              {published
                ? <span>Published <TimeAgo time={published._updatedAt} /></span>
                : 'Not published'
              }
            </div>
          </div>
          <form className={styles.editor} onSubmit={preventDefault} id="Sanity_Default_DeskTool_Editor_ScrollContainer">
            <FormBuilder
              schema={schema}
              patchChannel={patchChannel}
              value={draft || published || {_type: type.name}}
              type={type}
              onChange={this.handleChange}
            />
          </form>

          {afterEditorComponents.map((AfterEditorComponent, i) =>
            <AfterEditorComponent key={i} documentId={published._id} />)}

          {inspect && (
            <InspectView
              value={value}
              onClose={() => this.setState({inspect: false})}
            />
          )}
          {showConfirmPublish && (
            <ConfirmPublish
              draft={draft}
              published={published}
              onCancel={this.handleCancelConfirmPublish}
              onConfirm={this.handleConfirmPublish}
            />
          )}
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

          {transactionResult && transactionResult.type === 'error' && (
            <Snackbar
              kind={'danger'}
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
})
