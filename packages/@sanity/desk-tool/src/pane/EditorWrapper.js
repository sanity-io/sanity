import PropTypes from 'prop-types'
// Connects the FormBuilder with various sanity roles
import React from 'react'
import {catchError, map, tap} from 'rxjs/operators'
import {merge, of as observableOf} from 'rxjs'
import {validateDocument} from '@sanity/validation'
import promiseLatest from 'promise-latest'
import {omit, throttle, debounce} from 'lodash'
import {FormBuilder, checkoutPair} from 'part:@sanity/form-builder'
import schema from 'part:@sanity/base/schema'
import Button from 'part:@sanity/components/buttons/default'
import client from 'part:@sanity/base/client'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'
import Editor from './Editor'
import styles from './styles/EditorWrapper.css'

const INITIAL_DOCUMENT_STATE = {
  isLoading: true,
  deletedSnapshot: null,
  snapshot: null
}

const INITIAL_STATE = {
  isSaving: true,
  isReconnecting: false,
  isCreatingDraft: false,
  transactionResult: null,
  validationPending: true,
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
        snapshot: event.document
          ? {
              ...event.document,
              // todo: The following line is a temporary workaround for a problem with the mutator not
              // setting updatedAt on patches applied optimistic when they are received from server
              // can be removed when this is fixed
              _updatedAt: new Date().toISOString()
            }
          : event.document
      }
    }
    case 'reconnect': {
      return {}
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

export default class EditorWrapper extends React.Component {
  static propTypes = {
    documentId: PropTypes.string.isRequired,
    typeName: PropTypes.string.isRequired
  }

  state = INITIAL_STATE
  patchChannel = FormBuilder.createPatchChannel()

  setup(documentId) {
    this.dispose()
    const publishedId = getPublishedId(documentId)
    const draftId = getDraftId(documentId)

    const {published, draft} = checkoutPair({publishedId, draftId})
    this.published = published
    this.draft = draft
    this.validateLatestDocument = debounce(promiseLatest(this.validateDocument, 300))

    const published$ = this.published.events
    const draft$ = this.draft.events.pipe(tap(this.receiveDraftEvent))

    this.subscription = merge(
      published$.pipe(map(event => ({...event, version: 'published'}))),
      draft$.pipe(map(event => ({...event, version: 'draft'})))
    ).subscribe(event => {
      this.setState(prevState => {
        const version = event.version // either 'draft' or 'published'
        return {
          validationPending: true,
          [version]: {
            ...(prevState[version] || {}),
            ...documentEventToState(event),
            isLoading: false
          }
        }
      }, this.validateLatestDocument)
    })
  }

  validateDocument = async () => {
    const {draft, published} = this.state
    const doc = (draft && draft.snapshot) || (published && published.snapshot)
    if (!doc || !doc._type) {
      return []
    }

    const type = schema.get(doc._type)
    if (!type) {
      // eslint-disable-next-line no-console
      console.warn('Schema for document type "%s" not found, skipping validation')
      return []
    }

    const markers = await validateDocument(doc, schema)
    this.setStateIfMounted({markers, validationPending: false})
    return markers
  }

  receiveDraftEvent = event => {
    this.setState({isReconnecting: event.type === 'reconnect'})
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
    this._isMounted = true
    this.setup(this.props.documentId)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.documentId !== this.props.documentId) {
      this.setState(INITIAL_STATE)
      this.setup(nextProps.documentId)
    }
  }

  componentWillUnmount() {
    this._isMounted = false

    // Cancel throttled commit since draft will be nulled on unmount
    this.commit.cancel()

    // Instead, explicitly commit
    this.draft.commit().subscribe(() => {
      // todo: error handling
    })

    this.dispose()
  }

  isLiveEditEnabled() {
    const selectedSchemaType = schema.get(this.props.typeName)
    return selectedSchemaType.liveEdit === true
  }

  dispose() {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }

    if (this.validateLatestDocument) {
      this.validateLatestDocument.cancel()
      this.validateLatestDocument = null
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

    const tx = client.observable
      .transaction()
      .delete(getPublishedId(documentId))
      .delete(getDraftId(documentId))

    tx
      .commit()
      .pipe(
        map(result => ({
          type: 'success',
          result: result
        })),
        catchError(error =>
          observableOf({
            type: 'error',
            message: `An error occurred while attempting to delete document.
              This usually means that you attempted to delete a document that other documents
              refers to.`,
            error
          })
        )
      )
      .subscribe(result => {
        this.setStateIfMounted({transactionResult: result})
      })
  }

  handleClearTransactionResult = () => {
    this.setStateIfMounted({transactionResult: null})
  }

  handleUnpublish = () => {
    const {documentId} = this.props
    const {published} = this.state

    let tx = client.observable.transaction().delete(getPublishedId(documentId))

    if (published.snapshot) {
      tx = tx.createIfNotExists({
        ...omit(published.snapshot, '_updatedAt'),
        _id: getDraftId(documentId)
      })
    }

    tx
      .commit()
      .pipe(
        map(result => ({
          type: 'success',
          result: result
        })),
        catchError(error =>
          observableOf({
            type: 'error',
            message: `An error occurred while attempting to unpublish document.
        This usually means that you attempted to unpublish a document that other documents
        refers to.`,
            error
          })
        )
      )
      .subscribe(result => {
        this.setStateIfMounted({transactionResult: result})
      })
  }

  handlePublish = () => {
    const {documentId} = this.props
    const {draft, published} = this.state
    this.setState({isPublishing: true})

    const tx = client.observable.transaction()

    if (!published || !published.snapshot) {
      // If the document has not been published, we want to create it - if it suddenly exists
      // before being created, we don't want to overwrite if, instead we want to yield an error
      tx.create({
        ...omit(draft.snapshot, '_updatedAt'),
        _id: getPublishedId(documentId)
      })
    } else {
      // If it exists already, we only want to update it if the revision on the remote server
      // matches what our local state thinks it's at
      tx
        .patch(getPublishedId(documentId), {
          // Hack until other mutations support revision locking
          unset: ['_reserved_prop_'],
          ifRevisionID: published.snapshot._rev
        })
        .createOrReplace({
          ...omit(draft.snapshot, '_updatedAt'),
          _id: getPublishedId(documentId)
        })
    }

    tx.delete(getDraftId(documentId))

    // @todo add error handling for revision mismatch
    tx
      .commit()
      .pipe(
        map(result => ({
          type: 'success',
          result: result
        })),
        catchError(error =>
          observableOf({
            type: 'error',
            message: 'An error occurred while attempting to publishing document',
            error
          })
        )
      )
      .subscribe({
        next: result => {
          this.setState({
            transactionResult: result
          })
        },
        complete: () => {
          this.setStateIfMounted({isPublishing: false})
        }
      })
  }

  handleChange = event => {
    const {published, draft} = this.state
    const {typeName} = this.props

    if (this.isLiveEditEnabled()) {
      // No drafting, patch and commit the published document
      this.published.createIfNotExists({
        _id: this.getPublishedId(),
        _type: typeName
      })
      this.published.patch(event.patches)
    } else {
      if (!draft.snapshot) {
        this.draft.createIfNotExists({
          ...omit(published.snapshot, '_updatedAt'),
          _id: this.getDraftId(),
          _type: typeName
        })
      }
      this.draft.patch(event.patches)
    }
    this.commit()
  }

  setStateIfMounted = (...args) => {
    if (!this._isMounted) {
      return
    }

    this.setState(...args)
  }

  commit = throttle(
    () => {
      const currentDoc = this.isLiveEditEnabled() ? this.published : this.draft
      this.setStateIfMounted({isSaving: true})

      currentDoc.commit().subscribe({
        next: () => {
          // todo
        },
        error: error => {
          // todo
        },
        complete: () => {
          this.setStateIfMounted({isSaving: false})
        }
      })
    },
    1000,
    {leading: true, trailing: true}
  )

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
      <div className={styles.deletedDocument}>
        <div className={styles.deletedDocumentInner}>
          <h3>This document just got deleted</h3>
          <p>You can undo deleting it until you close this window/tab</p>
          <Button onClick={this.handleRestoreDeleted}>Undo delete</Button>
        </div>
      </div>
    )
  }

  render() {
    const {typeName} = this.props
    const {
      draft,
      published,
      markers,
      isCreatingDraft,
      isUnpublishing,
      transactionResult,
      isPublishing,
      isSaving,
      validationPending,
      isReconnecting
    } = this.state

    if (isRecoverable(draft, published)) {
      return this.renderDeleted()
    }

    return (
      <Editor
        patchChannel={this.patchChannel}
        type={schema.get(typeName)}
        published={published.snapshot}
        draft={draft.snapshot}
        markers={markers}
        validationPending={validationPending}
        isLoading={draft.isLoading || published.isLoading}
        isSaving={isSaving}
        isReconnecting={isReconnecting}
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
