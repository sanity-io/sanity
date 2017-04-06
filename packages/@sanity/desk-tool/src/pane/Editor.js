// Connects the FormBuilder with various sanity roles
import React, {PropTypes} from 'react'
import documentStore from 'part:@sanity/base/datastore/document'
import Spinner from 'part:@sanity/components/loading/spinner'
import Button from 'part:@sanity/components/buttons/default'
import FormBuilder from 'part:@sanity/form-builder'
import ReferringDocumentsHelper from '../components/ReferringDocumentsHelper'
import InspectView from '../components/InspectView'
import {withRouterHOC} from 'part:@sanity/base/router'
import TrashIcon from 'part:@sanity/base/trash-icon'
import styles from './styles/Editor.css'
import copyDocument from '../utils/copyDocument'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import Menu from 'part:@sanity/components/menus/default'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'
import dataAspects from '../utils/dataAspects'
import {debounce} from 'lodash'

const preventDefault = ev => ev.preventDefault()

// Want a nicer api for listen/ulinsten
function listen(target, eventType, callback, useCapture = false) {
  target.addEventListener(eventType, callback, useCapture)
  return function unlisten() {
    target.removeEventListener(eventType, callback, useCapture)
  }
}

function getInitialState() {
  return {
    inspect: false,
    isMenuOpen: false,
    showSavingStatus: false
  }
}

const menuItems = [
  {
    title: 'Duplicate',
    icon: ContentCopyIcon,
    action: 'duplicate',
    key: 'duplicate'
  },
  {
    title: 'Delete',
    icon: TrashIcon,
    action: 'delete',
    key: 'delete',
    divider: true,
    danger: true
  }
]

export default withRouterHOC(class Editor extends React.PureComponent {
  static propTypes = {
    documentId: PropTypes.string.isRequired,
    value: PropTypes.object,
    type: PropTypes.object.isRequired,
    router: PropTypes.shape({
      state: PropTypes.object
    }).isRequired,
    onDelete: PropTypes.func,
    onCreate: PropTypes.func,
    onChange: PropTypes.func,

    isDeleted: PropTypes.bool,
    isLoading: PropTypes.bool,
    isSaving: PropTypes.bool,
    isDeleting: PropTypes.bool,

    snapshot: PropTypes.object,
  }

  static defaultProps = {
    snapshot: null,
    isLoading: false,
    isSaving: false,
    isDeleting: false,
    isDeleted: false,
    onDelete() {},
    onCreate() {},
    onChange() {},
  }

  state = getInitialState()

  serialize(value) {
    return value.serialize()
  }

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
    const {router, value} = this.props
    documentStore.create(copyDocument(value.serialize())).subscribe(copied => {
      router.navigate({...router.state, action: 'edit', selectedDocumentId: copied._id})
    })
  }

  handleRestore = () => {
    const {snapshot} = this.props
    this.props.onCreate(snapshot)
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

  handleMenuClick = item => {
    if (item.action === 'delete') {
      this.handleRequestDelete()
    }

    if (item.action === 'duplicate') {
      this.handleCreateCopy()
    }
  }

  render() {
    const {value, type, snapshot, documentId, onChange, isLoading, isDeleted, isDeleting} = this.props

    const {inspect, referringDocuments, showSavingStatus} = this.state

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
        <div className={styles.top}>
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
                  items={menuItems}
                  origin="top-right"
                />
              </div>
            </div>
          </div>
          <h1 className={styles.heading}>
            {titleProp && String(value[titleProp] || 'Untitled…')}
          </h1>

          {
            isDeleting && (
              <div className={styles.savingStatus}>Deleting…</div>
            )
          }

          {
            showSavingStatus && (
              <div className={styles.savingStatus}>
                <span className={styles.spinner}><Spinner /></span> Saving…
              </div>
            )
          }
          {
            !showSavingStatus && (
              <div className={styles.savingStatus}>
                ✓ Saved
              </div>
            )
          }
        </div>

        <form className={styles.editor} onSubmit={preventDefault} id="Sanity_Default_DeskTool_Editor_ScrollContainer">
          <FormBuilder
            key={documentId}
            value={value}
            type={type}
            onChange={onChange}
          />
        </form>

        {inspect && (
          <InspectView
            value={snapshot}
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
      </div>
    )
  }
})
