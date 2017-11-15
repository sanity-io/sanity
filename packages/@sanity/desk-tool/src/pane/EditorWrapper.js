import PropTypes from 'prop-types'
// Connects the FormBuilder with various sanity roles
import React from 'react'
import Observable from '@sanity/observable'
import {getDraftId, getPublishedId} from '../utils/draftUtils'
import FormBuilder, {checkout} from 'part:@sanity/form-builder'
import {omit, throttle} from 'lodash'
import Editor from './Editor'
import schema from 'part:@sanity/base/schema'
import Button from 'part:@sanity/components/buttons/default'
import client from 'part:@sanity/base/client'

const INITIAL_DOCUMENT_STATE = {
  isLoading: true,
  deletedSnapshot: null,
  snapshot: null
}

const INITIAL_STATE = {
  isSaving: true,
  isCreatingDraft: false,
  transactionResult: null,
  draft: INITIAL_DOCUMENT_STATE,
  published: INITIAL_DOCUMENT_STATE
}

function documentEventToState(event) {
  switch (event.type) {
    case 'rebase':
    case 'create':
    case 'createIfNotExists':
    case 'snapshot': {
      return {
        deletedSnapshot: null,
        snapshot: event.document
      }
    }
    case 'mutation': {
      return {
        deletedSnapshot: event.deletedSnapshot,
        snapshot: event.document ? {
          ...event.document,
          // todo: The following line is a temporary workaround for a problem with the mutator not
          // setting updatedAt on patches applied optimistic when they are received from server
          // can be removed when this is fixed
          _updatedAt: new Date().toISOString()
        } : event.document
      }
    }
    default: {
      // eslint-disable-next-line no-console
      console.log('Unhandled document event type "%s"', event.type, event)
      return {}
    }
  }
}

function exists(draft, published) {
  return draft.snapshot || published.snapshot
}

function isRecoverable(draft, published) {
  return !exists(draft, published) && (draft.deletedSnapshot || published.deletedSnapshot)
}

export default class EditorPane extends React.Component {
  static propTypes = {
    documentId: PropTypes.string.isRequired,
    typeName: PropTypes.string.isRequired
  }

  state = INITIAL_STATE
  patchChannel = FormBuilder.createPatchChannel()

  setup(documentId) {
    this.dispose()
    this.published = checkout(getPublishedId(documentId))
    this.draft = checkout(getDraftId(documentId))

    this.subscription = this.published
      .events.map(event => ({...event, version: 'published'}))
      .merge(
        this.draft.events
          .do(this.receiveDraftEvent)
          .map(event => ({...event, version: 'draft'}))
      )
      .subscribe(event => {
        this.setState(prevState => {
          const version = event.version // either 'draft' or 'published'
          return {
            [version]: {
              ...(prevState[version] || {}),
              ...documentEventToState(event),
              isLoading: false
            }
          }
        })
      })
  }

  receiveDraftEvent = event => {
    if (event.type !== 'mutation') {
      return
    }
    // Broadcast incoming patches to input components that applies patches on their own
    // Note: This is *experimental*
    this.patchChannel.receivePatches({
      patches: event.patches,
      snapshot: event.document
    })
  }

  getDraftId() {
    return getDraftId(this.props.documentId)
  }

  getPublishedId() {
    return getPublishedId(this.props.documentId)
  }

  componentDidMount() {
    this.setup(this.props.documentId)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.documentId !== this.props.documentId) {
      this.setState(INITIAL_STATE)
      this.setup(nextProps.documentId)
    }
  }

  componentWillUnmount() {
    this.dispose()
  }

  dispose() {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
    this.published = null
    this.draft = null
  }

  handleDiscardDraft = () => {
    this.draft.delete()
    this.draft.commit().subscribe(() => {
      // todo: error handling
    })
  }

  handleDelete = () => {
    const {documentId} = this.props
    const tx = client.observable.transaction()
      .delete(getPublishedId(documentId))
      .delete(getDraftId(documentId))

    Observable.from(tx.commit())
      .map(result => ({
        type: 'success',
        result: result
      }))
      .catch(error => Observable.of({
        type: 'error',
        message: `An error occurred while attempting to delete document.
        This usually means that you attempted to delete a document that other documents
        refers to.`,
        error
      }))
      .subscribe(result => {
        this.setState({transactionResult: result})
      })
  }

  handleClearTransactionResult = () => {
    this.setState({transactionResult: null})
  }

  handleUnpublish = () => {
    const {documentId} = this.props
    const {published} = this.state

    let tx = client.observable
      .transaction()
      .delete(getPublishedId(documentId))

    if (published.snapshot) {
      tx = tx.createIfNotExists({
        ...omit(published.snapshot, '_createdAt', '_updatedAt'),
        _id: getDraftId(documentId)
      })
    }

    Observable.from(tx.commit())
      .map(result => ({
        type: 'success',
        result: result
      }))
      .catch(error => Observable.of({
        type: 'error',
        message: `An error occurred while attempting to unpublish document.
        This usually means that you attempted to {transactionResult.action} a document that other documents
        refers to.`,
        error
      }))
      .subscribe(result => {
        this.setState({transactionResult: result})
      })
  }

  handlePublish = draft => {

    this.setState({isPublishing: true})

    const publishedId = this.getPublishedId()

    this.published.createOrReplace({
      ...omit(draft, '_createdAt', '_updatedAt'),
      _id: publishedId
    })

    return this.published.commit()
      .mergeMap(() => {
        this.draft.delete()
        return this.draft.commit()
      })
      .subscribe(() =>
        this.setState({isPublishing: false})
      )
  }

  handleChange = event => {
    const {published, draft} = this.state
    const {typeName} = this.props

    if (!draft.snapshot) {
      this.draft.createIfNotExists({
        ...omit(published.snapshot, '_createdAt', '_updatedAt'),
        _id: this.getDraftId(),
        _type: typeName
      })
    }

    this.draft.patch(event.patches)
    this.commit()
  }

  commit = throttle(() => {
    this.setState({isSaving: true})
    this.draft.commit().subscribe({
      next: () => {
        // todo
      },
      error: error => {
        // todo
      },
      complete: () => {
        this.setState({isSaving: false})
      }
    })
  }, 1000, {leading: true, trailing: true})

  handleRestoreDeleted = () => {
    const {draft, published} = this.state

    const commits = []
    if (draft.deletedSnapshot) {
      this.draft.createIfNotExists(draft.deletedSnapshot)
      commits.push(this.draft.commit())
    } else if (published.deletedSnapshot) {
      this.published.createIfNotExists(published.deletedSnapshot)
      commits.push(this.published.commit())
    }
    commits.forEach(c => {
      c.subscribe({
        next: () => {}
      })
    })
  }

  renderDeleted() {
    return (
      <div>
        <h3>This document just got deleted</h3>
        <p>You can undo deleting it until you close this window/tab</p>
        <Button onClick={this.handleRestoreDeleted}>Undo delete</Button>
      </div>
    )
  }

  render() {
    const {typeName} = this.props
    const {draft, published, isCreatingDraft, isUnpublishing, transactionResult, isPublishing, isSaving} = this.state

    if (isRecoverable(draft, published)) {
      return this.renderDeleted()
    }

    return (
      <Editor
        patchChannel={this.patchChannel}
        type={schema.get(typeName)}
        published={published.snapshot}
        draft={draft.snapshot}
        isLoading={draft.isLoading || published.isLoading}
        isSaving={isSaving}
        isPublishing={isPublishing}
        isUnpublishing={isUnpublishing}
        transactionResult={transactionResult}
        isCreatingDraft={isCreatingDraft}
        onDelete={this.handleDelete}
        onClearTransactionResult={this.handleClearTransactionResult}
        onDiscardDraft={this.handleDiscardDraft}
        onPublish={this.handlePublish}
        onUnpublish={this.handleUnpublish}
        onChange={this.handleChange}
      />
    )
  }
}
