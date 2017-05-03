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
import ReferringDocumentsHelper from '../components/ReferringDocumentsHelper'
import InspectView from '../components/InspectView'
import {withRouterHOC} from 'part:@sanity/base/router'
import TrashIcon from 'part:@sanity/base/trash-icon'
import UndoIcon from 'part:@sanity/base/undo-icon'
import UnpublishIcon from 'part:@sanity/base/unpublish-icon'
import styles from './styles/Editor.css'
import copyDocument from '../utils/copyDocument'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import Menu from 'part:@sanity/components/menus/default'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'
import documentStore from 'part:@sanity/base/datastore/document'
import dataAspects from '../utils/dataAspects'
import {debounce, truncate} from 'lodash'
import moment from 'moment'
import {newDraftFrom} from '../utils/draftUtils'

const preventDefault = ev => ev.preventDefault()

// Want a nicer api for listen/ulinsten
function listen(target, eventType, callback, useCapture = false) {
  target.addEventListener(eventType, callback, useCapture)
  return function unlisten() {
    target.removeEventListener(eventType, callback, useCapture)
  }
}

const MENU_ITEM_DUPLICATE = {
  action: 'duplicate',
  title: 'Duplicate',
  icon: ContentCopyIcon,
}

const MENU_ITEM_DISCARD = {
  action: 'discard',
  title: 'Discard changes…',
  icon: UndoIcon,
  divider: true
}

const MENU_ITEM_UNPUBLISH = {
  action: 'unpublish',
  title: 'Unpublish…',
  icon: UnpublishIcon,
  divider: true
}

const MENU_ITEM_DELETE = {
  action: 'delete',
  title: 'Delete…',
  icon: TrashIcon,
  divider: true,
  danger: true
}

const getMenuItems = (draft, published) => ([
  MENU_ITEM_DUPLICATE,
  published && draft && MENU_ITEM_DISCARD,
  published && MENU_ITEM_UNPUBLISH,
  MENU_ITEM_DELETE
]).filter(Boolean)

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
    isDeleted: PropTypes.bool,
    isLoading: PropTypes.bool,
    isSaving: PropTypes.bool,
    isDeleting: PropTypes.bool,
    deletedSnapshot: PropTypes.object
  }

  static defaultProps = {
    isLoading: false,
    isSaving: false,
    isUnpublishing: false,
    isPublishing: false,
    isCreatingDraft: false,
    isDeleted: false,
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
  }, 2000, {trailing: true})

  handleReferenceResult = event => {
    if (event.documents.length === 0) {
      this.props.onDelete()
    } else {
      this.setState({referringDocuments: event.documents})
    }
  }

  handleRequestDelete = () => {
    this.refSubscription = documentStore.query('*[references($docId)] [0...101]', {docId: this.props.documentId})
      .subscribe({
        next: this.handleReferenceResult,
        error: this.handleReferenceError
      })
  }

  handleCancelDeleteRequest = () => {
    this.setState({referringDocuments: null})
  }

  handleCreateCopy = () => {
    const {router, draft, published} = this.props
    documentStore.create(newDraftFrom(copyDocument(draft || published))).subscribe(copied => {
      router.navigate({...router.state, action: 'edit', selectedDocumentId: copied._id})
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

  handleCancelDelete= () => {
    this.setState({showConfirmDelete: false})
  }

  handleCancelDiscard= () => {
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
    const {onDelete, onDiscardDraft, draft, published} = this.props
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

    if (item.action === 'duplicate') {
      this.handleCreateCopy()
    }
    this.setState({isMenuOpen: false})
  }

  render() {
    const {
      draft,
      published,
      type,
      isLoading,
      isDeleted,
      isPublishing,
      isUnpublishing,
      isDeleting,
      isCreatingDraft
    } = this.props

    const {inspect,
      referringDocuments,
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

    if (isDeleted) {
      return (
        <div className={styles.root}>
          <p>Document was deleted</p>
          <Button onClick={this.handleRestore}>Restore</Button>
        </div>
      )
    }

    if (!value) {
      return (
        <div className={styles.root}>
          <p>Document does not exists</p>
        </div>
      )
    }

    const titleProp = dataAspects.getItemDisplayField(type.name)

    return (
      <div className={styles.root}>
        {isCreatingDraft && (
          <div className={styles.overlay}>
            <Spinner fullscreen message="Making changes…" />
          </div>
        )}
        {isDeleting && (
          <div className={styles.overlay}>
            <Spinner fullscreen message="Deleting…" />
          </div>
        )}
        {isPublishing && (
          <div className={styles.overlay}>
            <Spinner fullscreen message="Publishing…" />
          </div>
        )}
        {isUnpublishing && (
          <div className={styles.overlay}>
            <Spinner fullscreen message="Unpublishing…" />
          </div>
        )}
        <div className={styles.top}>
          <h1 className={styles.heading}>
            {titleProp && truncate(String(value[titleProp] || 'Untitled…'), {length: 50})}
          </h1>
          <div className={styles.publishButton}>
            <Button disabled={!draft} onClick={this.handlePublishButtonClick} color="primary">
              Publish
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
        <div className={styles.dates}>
          <div>Created {moment((published || draft)._createdAt).fromNow()}</div>
          <div>{published ? `Published ${moment(published._updatedAt).fromNow()}` : 'Not published'}</div>
          {showSavingStatus && (
            <div className={styles.savingStatus}>
              <span className={styles.spinner}><Spinner /></span> Saving…
            </div>
          )}
          {!showSavingStatus && (
            <div className={styles.savingStatus}>
              ✓ Saved {/*{moment(value._updatedAt).fromNow()} */}
            </div>
          )}
        </div>
        <form className={styles.editor} onSubmit={preventDefault} id="Sanity_Default_DeskTool_Editor_ScrollContainer">
          <FormBuilder
            value={draft || published}
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

        {referringDocuments && (
          <ReferringDocumentsHelper
            documents={referringDocuments}
            currentValue={value}
            onCancel={this.handleCancelDeleteRequest}
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
