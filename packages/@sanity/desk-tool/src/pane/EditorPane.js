import PropTypes from 'prop-types'
import React from 'react'
import promiseLatest from 'promise-latest'
import {merge, concat, timer, of as observableOf} from 'rxjs'
import {catchError, switchMap, map, mapTo, tap} from 'rxjs/operators'
import {validateDocument} from '@sanity/validation'
import {omit, throttle, debounce} from 'lodash'
import {FormBuilder, checkoutPair} from 'part:@sanity/form-builder'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'
import schema from 'part:@sanity/base/schema'
import Button from 'part:@sanity/components/buttons/default'
import historyStore from 'part:@sanity/base/datastore/history'
import client from 'part:@sanity/base/client'
import styles from './styles/EditorWrapper.css'
import Editor from './Editor'
import UseState from '../utils/UseState'
import withInitialValue from '../utils/withInitialValue'

const INITIAL_DOCUMENT_STATE = {
  isLoading: true,
  deletedSnapshot: null,
  snapshot: null
}

const INITIAL_STATE = {
  isSaving: true,
  isReconnecting: false,
  isRestoring: false,
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
    case 'committed': {
      // note: we *could* use this in conjunction with <document>.commit()
      // by setting this.state.isSaving=true before calling <document>.commit and setting to false
      // again when we get the 'committed' event back.
      // However, calling <document>.commit() doesn't necessarily result in a commit actually being done,
      // and thus we are not guaranteed to get a 'committed' event back after a call to
      // <document>.commit(), which means we could easily get into a situation where the
      // `isSaving` state stays around forever.
      return {}
    }
    case 'error': {
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

export default withInitialValue(
  class EditorPane extends React.Component {
    static propTypes = {
      title: PropTypes.string,
      index: PropTypes.number.isRequired,
      initialValue: PropTypes.object, // eslint-disable-line react/forbid-prop-types
      options: PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        template: PropTypes.string
      }).isRequired
    }

    static defaultProps = {
      title: null,
      initialValue: undefined
    }

    state = INITIAL_STATE
    patchChannel = FormBuilder.createPatchChannel()

    constructor(props) {
      super(props)
      this.setup(props.options.id)
    }

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
      )
        .pipe(
          switchMap(event =>
            event.type === 'reconnect' ? timer(500).pipe(mapTo(event)) : observableOf(event)
          ),
          catchError((err, _caught$) => {
            // eslint-disable-next-line no-console
            console.error(err)
            return observableOf({type: 'error', error: err})
          })
        )
        .subscribe(event => {
          this.setState(prevState => {
            const version = event.version // either 'draft' or 'published'
            return {
              isReconnecting: event.type === 'reconnect',
              validationPending: true,
              error: event.type === 'error' ? event.error : null,
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
      return getDraftId(this.props.options.id)
    }

    getPublishedId() {
      return getPublishedId(this.props.options.id)
    }

    componentDidUpdate(prevProps) {
      if (prevProps.options.id !== this.props.options.id) {
        this.setup(this.props.options.id)
      }
    }

    componentDidMount() {
      this._isMounted = true
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
      const selectedSchemaType = schema.get(this.props.options.type)
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

    handleDelete = () => {
      const documentId = this.props.options.id

      const tx = client.observable
        .transaction()
        .delete(getPublishedId(documentId))
        .delete(getDraftId(documentId))

      tx.commit()
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
      const documentId = this.props.options.id
      const {published} = this.state

      let tx = client.observable.transaction().delete(getPublishedId(documentId))

      if (published.snapshot) {
        tx = tx.createIfNotExists({
          ...omit(published.snapshot, '_updatedAt'),
          _id: getDraftId(documentId)
        })
      }

      tx.commit()
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
      const documentId = this.props.options.id
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
        tx.patch(getPublishedId(documentId), {
          // Hack until other mutations support revision locking
          unset: ['_reserved_prop_'],
          ifRevisionID: published.snapshot._rev
        }).createOrReplace({
          ...omit(draft.snapshot, '_updatedAt'),
          _id: getPublishedId(documentId)
        })
      }

      tx.delete(getDraftId(documentId))

      // @todo add error handling for revision mismatch
      tx.commit()
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

    handleRestoreRevision = ({id, rev}) => {
      const transactionResult$ = historyStore.restore(id, rev).pipe(
        map(result => ({
          type: 'success',
          result: result
        })),
        catchError(error =>
          observableOf({
            type: 'error',
            message: 'An error occurred while attempting to restore the document',
            error
          })
        ),
        map(transactionResult => ({transactionResult}))
      )

      concat(
        observableOf({isRestoring: true}),
        transactionResult$,
        observableOf({isRestoring: false})
      ).subscribe(nextState => {
        this.setStateIfMounted(nextState)
      })
    }

    handleChange = event => {
      const {published, draft} = this.state
      const initialValue = this.getInitialValue()

      if (this.isLiveEditEnabled()) {
        // No drafting, patch and commit the published document
        this.published.createIfNotExists({
          _id: this.getPublishedId(),
          ...initialValue
        })
        this.published.patch(event.patches)
      } else {
        if (!draft.snapshot) {
          this.draft.createIfNotExists({
            ...omit(published.snapshot, '_updatedAt'),
            _id: this.getDraftId(),
            ...initialValue
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

    renderError(error) {
      return (
        <div className={styles.error}>
          <div className={styles.errorInner}>
            <h3>We’re sorry, but your changes could not be applied.</h3>
            <UseState startWith={false}>
              {([isExpanded, setExpanded]) => (
                <>
                  <Button onClick={() => this.setup(this.props.options.id)}>Reload</Button>
                  <Button inverted onClick={() => setExpanded(!isExpanded)}>
                    {isExpanded ? 'Hide' : 'Show'} details
                  </Button>
                  <div>
                    {isExpanded && (
                      <textarea
                        className={styles.errorDetails}
                        onFocus={e => e.currentTarget.select()}
                        value={error.stack}
                      />
                    )}
                  </div>
                </>
              )}
            </UseState>
          </div>
        </div>
      )
    }

    renderUnknownSchemaType() {
      const {options} = this.props
      const {draft, published} = this.state
      const typeName = options.type
      const doc = draft.snapshot || published.snapshot
      return (
        <div className={styles.unknownSchemaType}>
          <div className={styles.unknownSchemaTypeInner}>
            <h3>Unknown schema type</h3>
            <p>
              This document has the schema type <code>{typeName}</code>, which is not defined as a
              type in the local content studio schema.
            </p>
            {__DEV__ && doc && (
              <div>
                <h4>Here is the JSON representation of the document:</h4>
                <pre className={styles.jsonDump}>
                  <code>{JSON.stringify(doc, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )
    }

    getInitialValue() {
      const {draft, published} = this.state
      const typeName = this.props.options.type
      const base = {_type: typeName}
      return exists(draft, published) ? base : {...base, ...this.props.initialValue}
    }

    render() {
      const initialValue = this.getInitialValue()
      const {options, index, title} = this.props
      const typeName = options.type
      const schemaType = schema.get(typeName)
      const {
        draft,
        published,
        markers,
        isCreatingDraft,
        isUnpublishing,
        transactionResult,
        isPublishing,
        isRestoring,
        isSaving,
        error,
        validationPending,
        isReconnecting
      } = this.state

      if (!schemaType) {
        return this.renderUnknownSchemaType()
      }

      if (isRecoverable(draft, published)) {
        return this.renderDeleted()
      }

      if (error) {
        return this.renderError(error)
      }

      return (
        <Editor
          title={title}
          paneIndex={index}
          patchChannel={this.patchChannel}
          type={schemaType}
          published={published.snapshot}
          draft={draft.snapshot}
          markers={markers}
          initialValue={initialValue}
          validationPending={validationPending}
          isLoading={draft.isLoading || published.isLoading}
          isRestoring={isRestoring}
          isSaving={isSaving}
          isReconnecting={isReconnecting}
          isPublishing={isPublishing}
          isUnpublishing={isUnpublishing}
          transactionResult={transactionResult}
          isCreatingDraft={isCreatingDraft}
          onDelete={this.handleDelete}
          onClearTransactionResult={this.handleClearTransactionResult}
          onPublish={this.handlePublish}
          onRestore={this.handleRestoreRevision}
          onUnpublish={this.handleUnpublish}
          onChange={this.handleChange}
        />
      )
    }
  }
)
