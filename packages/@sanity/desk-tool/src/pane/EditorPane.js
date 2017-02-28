// Connects the FormBuilder with various sanity roles
import React, {PropTypes} from 'react'
import documentStore from 'part:@sanity/base/datastore/document'
import Spinner from 'part:@sanity/components/loading/spinner'
import DefaultButton from 'part:@sanity/components/buttons/default'
import FormBuilder from 'part:@sanity/form-builder'
import schema from 'part:@sanity/base/schema'
import ReferringDocumentsHelper from '../components/ReferringDocumentsHelper'
import InspectView from '../components/InspectView'
import dataAspects from '../utils/dataAspects'
import {throttle, omit} from 'lodash'
import {withRouterHOC} from 'part:@sanity/base/router'
import TrashIcon from 'part:@sanity/base/trash-icon'
import PlusIcon from 'part:@sanity/base/plus-icon'
import styles from './styles/EditorPane.css'
import {Patcher} from '@sanity/mutator'
import copyDocument from '../utils/copyDocument'

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
    loading: true,
    spin: false,
    deleted: null,
    inspect: false,
    value: null,
    progress: {kind: 'info', message: 'Loading'}
  }
}


export default withRouterHOC(class EditorPane extends React.PureComponent {
  static propTypes = {
    documentId: PropTypes.string,
    typeName: PropTypes.string,
    router: PropTypes.shape({
      state: PropTypes.object
    })
  };

  subscriptions = [];

  state = getInitialState();

  deserialize(serialized) {
    const {typeName} = this.props
    return serialized
      ? FormBuilder.deserialize(serialized, typeName)
      : FormBuilder.createEmpty(typeName)
  }

  serialize(value) {
    return value.serialize()
  }

  setupSubscriptions(props) {
    this.tearDownSubscriptions()
    const {documentId} = props

    this.document = documentStore.checkout(documentId)

    const documentEvents = this.document.events.subscribe({
      next: this.handleDocumentEvent,
      // error: this.handleDocumentError
    })

    this.subscriptions = [documentEvents]
  }

  handleDocumentError = error => {
    this.setState({progress: {kind: 'error', message: error.message}})
  }

  handleDocumentEvent = event => {
    switch (event.type) {
      case 'snapshot': {
        this.setState({
          loading: false,
          progress: null,
          value: event.document ? this.deserialize(event.document) : null
        })
        break
      }
      case 'rebase': {
        this.setState({
          value: this.deserialize(event.document)
        })
        break
      }
      case 'mutation': {
        this.handleIncomingMutationEvent(event)
        break
      }
      case 'create': {
        this.setState({
          value: this.deserialize(event.document)
        })
        break
      }
      default: {
        // eslint-disable-next-line no-console
        console.log('Unhandled document event type "%s"', event.type, event)
      }
    }
  }

  tearDownSubscriptions() {
    this.subscriptions.forEach(sub => sub.unsubscribe())
  }

  componentDidMount() {
    this.setupSubscriptions(this.props)
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
    this.tearDownSubscriptions()
    this.unlistenForKey()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.documentId !== this.props.documentId) {
      this.setState(getInitialState())
      this.setupSubscriptions(nextProps)
    }
  }

  handleIncomingMutationEvent(event) {
    const {mutations, origin} = event
    const operations = []
    mutations.forEach(mutation => {
      if (mutation.create) {
        operations.push(prev => {
          if (prev) {
            throw new Error('Had an unexpected existing document when receiving a create mutation')
          }
          return this.deserialize(mutation.create)
        })
      } else if (mutation.delete) {
        // Handle deletions after the fact
        if (origin !== 'local') {
          operations.push(() => null)
        }
      } else if (mutation.patch) {
        operations.push(previous => new Patcher(mutation.patch).applyViaAccessor(previous))
      } else {
        // eslint-disable-next-line no-console
        console.error(new Error(`Received unsupported mutation ${JSON.stringify(mutation, null, 2)}`))
      }
    })

    const previousValue = this.state.value
    const nextValue = operations.reduce((prev, operation) => operation(prev), previousValue)

    this.setState({
      deleted: nextValue === null ? this.serialize(previousValue) : null,
      value: nextValue
    })
  }

  handleIncomingDelete(event) {
    const {router} = this.props
    router.navigate(omit(router.state, 'action', 'selectedDocumentId'), {replace: true})
  }

  commit = throttle(() => {
    this.setState({spin: true, progress: null})
    this.document.commit().subscribe({
      next: () => {
        this.setState({progress: {kind: 'success', message: 'Saved…'}})
      },
      error: err => {
        this.setState({progress: {kind: 'error', message: `Save failed ${err.message}`}})
      },
      complete: () => {
        this.setState({spin: false})
      }
    })
  }, 1000, {leading: true, trailing: true})

  handleChange = event => {
    this.document.patch(event.patches)
    this.commit()
  }

  handleReferenceResult = event => {
    if (event.documents.length === 0) {
      this.performDelete()
    } else {
      this.setState({referringDocuments: event.documents, deleteInProgress: false})
    }
  }

  performDelete = () => {
    this.setState({progress: {kind: 'info', message: 'Deleting…'}, deleteInProgress: false})
    this.document.delete()
    this.commit()
  }

  handleRequestDelete = () => {
    this.setState({progress: {kind: 'info', message: 'Checking references…'}, deleteInProgress: true})
    const refSubscription = documentStore.query('*[references($docId)] [0...101]', {docId: this.props.documentId}).subscribe({
      next: this.handleReferenceResult,
      error: this.handleReferenceError
    })

    this.subscriptions.push(refSubscription)
  }

  handleCancelDeleteRequest = () => {
    this.setState({progress: null, referringDocuments: null})
  }

  handleCreateCopy = () => {
    documentStore.create(copyDocument(this.state.value.serialize())).subscribe(copied => {
      const {router} = this.props
      router.navigate({...router.state, action: 'edit', selectedDocumentId: copied._id})
    })
  }

  handleRestore = () => {
    const {deleted} = this.state
    this.setState({progress: {kind: 'info', message: 'Restoring…'}})
    this.document.create(deleted)
    this.commit()
  }

  render() {
    const {value, inspect, deleted, loading, spin, validation, deleteInProgress, referringDocuments} = this.state
    const {typeName, documentId} = this.props
    const titleProp = dataAspects.getItemDisplayField(typeName)
    const schemaType = schema.get(this.props.typeName)

    if (loading) {
      return (
        <div className={styles.root}>
          <Spinner center message={`Loading ${schemaType.title}…`} />
        </div>
      )
    }

    if (deleted) {
      return (
        <div className={styles.root}>
          <p>Document was deleted</p>
          <DefaultButton onClick={this.handleRestore}>Restore</DefaultButton>
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

    return (
      <div className={styles.root}>


        <div className={styles.header}>
          <h2 className={styles.typeTitle}>{schemaType.title}</h2>
          <div className={styles.deleteContainer}>
            <DefaultButton
              onClick={this.handleCreateCopy}
              color="primary"
              kind="secondary"
              title="Create a copy"
              icon={PlusIcon}
            >
              Create a copy
            </DefaultButton>
            <DefaultButton
              onClick={this.handleRequestDelete}
              color="danger"
              kind="simple"
              loading={deleteInProgress}
              title={`Delete ${value.getAttribute(titleProp).serialize()}`}
              icon={TrashIcon}
            >
              Delete
            </DefaultButton>
          </div>
          <h1 className={styles.title}>
            {(titleProp && value.getAttribute(titleProp).serialize()) || 'Untitled…'}
          </h1>

          <div className={spin ? styles.spinner : styles.spinnerInactive}>
            <Spinner />
          </div>


        </div>
        <form className={styles.editor} onSubmit={preventDefault} id="Sanity_Default_FormBuilder_ScrollContainer">
          <FormBuilder
            key={documentId}
            value={value}
            validation={validation}
            onChange={this.handleChange}
          />
        </form>

        {referringDocuments && (
          <ReferringDocumentsHelper
            documents={referringDocuments}
            currentValue={value}
            onCancel={this.handleCancelDeleteRequest}
          />
        )}
        {inspect && (
          <InspectView
            value={value.serialize()}
            onClose={() => this.setState({inspect: false})}
          />
        )}
      </div>
    )
  }
})
