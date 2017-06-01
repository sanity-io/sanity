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
import BinaryIcon from 'react-icons/lib/go/file-binary'
import VisibilityOffIcon from 'part:@sanity/base/visibility-off-icon'
import styles from './styles/Editor.css'
import copyDocument from '../utils/copyDocument'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import Menu from 'part:@sanity/components/menus/default'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'
import documentStore from 'part:@sanity/base/datastore/document'
import {debounce, truncate, capitalize, startCase} from 'lodash'
import {getPublishedId, newDraftFrom} from '../utils/draftUtils'
import TimeAgo from '../components/TimeAgo'
import {PreviewFields} from 'part:@sanity/base/preview'

const preventDefault = ev => ev.preventDefault()

// Want a nicer api for listen/ulinsten
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

const getMenuItems = (draft, published) => ([
  getDiscardItem,
  getUnpublishItem,
  getDuplicateItem,
  getDeleteItem,
  getInspectItem
])
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

export default withRouterHOC(class Editor extends React.PureComponent {
  static propTypes = {
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
    onDelete() {},
    onCreate() {},
    onChange() {},
  }

  state = INITIAL_STATE

  componentDidMount() {
    this.unlistenForKey = listen(window, 'keypress', event => {
      const shouldToggle = event.ctrlKey
        && event.charCode === 9
        && event.altKey
        && !event.shiftKey

      if (shouldToggle) {
        this.setState({inspect: !this.state.inspect})
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

  render() {
    const {
      draft,
      published,
      type,
      isLoading,
      isPublishing,
      isUnpublishing,
      isCreatingDraft
    } = this.props

    const {
      inspect,
      showSavingStatus,
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
        </div>
      )
    }

    return (
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
          {value ? (
            <PreviewFields document={value} type={type} fields={['title']}>
              {({title}) => (
                <h1 className={styles.heading} title={String(title)}>
                  {capitalize(`Editing ${title && truncate(String(title || 'Untitled…'), {length: 50})}`)}
                </h1>
              )}
            </PreviewFields>
          ) : (<h1 className={styles.heading}>{capitalize(`Creating new ${type.title || startCase(type.name)}`)}</h1>)
          }
          <div className={styles.dates}>
            <div>
              {published
                ? <span>Published <TimeAgo time={published._updatedAt} /></span>
                : 'Not published'
              }
            </div>
            <div>
              {value && <span>Edited <TimeAgo time={value._updatedAt} /></span>}
            </div>
          </div>

          {showSavingStatus && (
            <div className={styles.savingStatus}>
              <span className={styles.spinner}><Spinner /></span> Saving…
            </div>
          )}
          {value && !showSavingStatus && (
            <div className={styles.savingStatus}>
              ✓ Saved
            </div>
          )}
          <div className={styles.publishButton}>
            <Button disabled={!draft} onClick={this.handlePublishButtonClick} color="primary">
              {published ? 'Publish changes' : 'Publish'}
            </Button>
          </div>
          <div className={styles.functions}>
            <div className={styles.menuContainer}>
              <div className={styles.menuButton}>
                <Button kind="simple" onClick={this.handleMenuToggle}>
                  <IconMoreVert />
                </Button>
              </div>
              <div className={styles.menu}>
                <Menu
                  onAction={this.handleMenuClick}
                  opened={this.state.isMenuOpen}
                  onClose={this.handleMenuClose}
                  onClickOutside={this.handleMenuClose}
                  items={getMenuItems(draft, published)}
                  origin="top-right"
                />
              </div>
            </div>
          </div>
        </div>
        <form className={styles.editor} onSubmit={preventDefault} id="Sanity_Default_DeskTool_Editor_ScrollContainer">
          <FormBuilder
            value={draft || published || {_type: type.name}}
            type={type}
            onChange={this.handleChange}
          />
        </form>

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
      </div>
    )
  }
})
