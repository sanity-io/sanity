/* eslint-disable complexity */
import React from 'react'
import PropTypes from 'prop-types'
import promiseLatest from 'promise-latest'
import {omit, throttle, debounce} from 'lodash'
import {distanceInWordsToNow} from 'date-fns'
import {Tooltip} from 'react-tippy'
import {merge, concat, timer, of as observableOf} from 'rxjs'
import {catchError, switchMap, map, mapTo, tap} from 'rxjs/operators'
import {resolveEnabledActions} from 'part:@sanity/base/util/document-action-utils'
import schema from 'part:@sanity/base/schema'
import Button from 'part:@sanity/components/buttons/default'
import client from 'part:@sanity/base/client'
import {PreviewFields} from 'part:@sanity/base/preview'
import Spinner from 'part:@sanity/components/loading/spinner'
import historyStore from 'part:@sanity/base/datastore/history'
import documentStore from 'part:@sanity/base/datastore/document'
import TabbedPane from 'part:@sanity/components/panes/tabbed'
import Snackbar from 'part:@sanity/components/snackbar/default'
import Hotkeys from 'part:@sanity/components/typography/hotkeys'
import {FormBuilder, checkoutPair} from 'part:@sanity/form-builder'
import {getDraftId, getPublishedId, newDraftFrom} from 'part:@sanity/base/util/draft-utils'
import {PaneRouterContext} from '../../'
import withInitialValue from '../utils/withInitialValue'
import copyDocument from '../utils/copyDocument'
import UseState from '../utils/UseState'
import ConfirmUnpublish from '../components/ConfirmUnpublish'
import ConfirmDelete from '../components/ConfirmDelete'
import InspectView from '../components/InspectView'
import InspectHistory from '../components/InspectHistory'
import DocTitle from '../components/DocTitle'
import TimeAgo from '../components/TimeAgo'
import RestoreHistoryButton from './Editor/RestoreHistoryButton'
import History from './History'
import documentStyles from './styles/Document.css'
import FormView from './Editor/FormView'
import Actions from './Editor/Actions'
import menuItemStyles from './styles/documentPaneMenuItems.css'
import EditorStatusBadge from './EditorStatusBadge'
import {getProductionPreviewItem, getMenuItems} from './documentPaneMenuItems'
import {validateDocument} from '@sanity/validation'

// Want a nicer api for listen/unlisten
function listen(target, eventType, callback, useCapture = false) {
  target.addEventListener(eventType, callback, useCapture)
  return function unlisten() {
    target.removeEventListener(eventType, callback, useCapture)
  }
}

function isInspectHotkey(event) {
  return event.ctrlKey && event.code === 'KeyI' && event.altKey && !event.shiftKey
}

function isPublishHotkey(event) {
  return event.ctrlKey && event.code === 'KeyP' && event.altKey && !event.shiftKey
}

function isPreviewHotkey(event) {
  return event.ctrlKey && event.code === 'KeyO' && event.altKey && !event.shiftKey
}

const isValidationError = marker => marker.type === 'validation' && marker.level === 'error'

const getSpinnerMessage = ({isCreatingDraft, isPublishing, isUnpublishing, isRestoring}) => {
  if (isCreatingDraft) {
    return 'Making changes…'
  }
  if (isPublishing) {
    return 'Publishing…'
  }
  if (isUnpublishing) {
    return 'Unpublishing…'
  }
  if (isRestoring) {
    return 'Restoring revision…'
  }
  return null
}

const INITIAL_DOCUMENT_STATE = {
  isLoading: true,
  deletedSnapshot: null,
  snapshot: null
}

const INITIAL_HISTORY_STATE = {
  isOpen: false,
  isLoading: true,
  error: null,
  events: [],
  selectedRev: null
}

const INITIAL_STATE = {
  markers: [],

  isCreatingDraft: false,
  isMenuOpen: false,
  isPublishing: false,
  isReconnecting: false,
  isRestoring: false,
  isSaving: false,
  isUnpublishing: false,

  transactionResult: null,
  validationPending: true,
  inspect: false,
  showSavingStatus: false,
  showConfirmDelete: false,
  showConfirmUnpublish: false,
  showValidationTooltip: false,
  draft: INITIAL_DOCUMENT_STATE,
  published: INITIAL_DOCUMENT_STATE,
  historyState: INITIAL_HISTORY_STATE
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
  class DocumentPane extends React.PureComponent {
    static contextType = PaneRouterContext

    static propTypes = {
      styles: PropTypes.object, // eslint-disable-line react/forbid-prop-types
      title: PropTypes.string,
      paneKey: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      isSelected: PropTypes.bool.isRequired,
      isCollapsed: PropTypes.bool.isRequired,
      isClosable: PropTypes.bool.isRequired,
      onExpand: PropTypes.func,
      onCollapse: PropTypes.func,
      menuItems: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired
        })
      ),
      menuItemGroups: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired
        })
      ),
      views: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          title: PropTypes.string.isRequired
        })
      ),
      initialValue: PropTypes.object, // eslint-disable-line react/forbid-prop-types
      options: PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        template: PropTypes.string
      }).isRequired
    }

    static defaultProps = {
      title: '',
      views: [],
      menuItems: [],
      menuItemGroups: [],
      styles: undefined,
      onExpand: undefined,
      onCollapse: undefined,
      initialValue: undefined
    }

    state = INITIAL_STATE
    patchChannel = FormBuilder.createPatchChannel()
    formRef = React.createRef()

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
      const {draft, published} = this.getDocumentSnapshots()
      const doc = draft || published
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
      this.unlistenForKeyUp = listen(window, 'keyup', this.handleKeyUp)
    }

    componentWillUnmount() {
      this.unlistenForKeyUp()

      this._isMounted = false

      // Cancel throttled commit since draft will be nulled on unmount
      this.commit.cancel()

      // Instead, explicitly commit
      this.draft.commit().subscribe(() => {
        // todo: error handling
      })

      this.setSavingStatus.cancel()

      this.dispose()
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

      if (this.duplicate$) {
        this.duplicate$.unsubscribe()
      }

      if (this._historyEventsSubscription) {
        this._historyEventsSubscription.unsubscribe()
      }

      this.published = null
      this.draft = null
    }

    handleToggleInspect = () => {
      this.setState(prevState => ({inspect: !prevState.inspect}))
    }

    handleKeyUp = event => {
      if (event.code === 'Escape' && this.state.showValidationTooltip) {
        return this.setState({showValidationTooltip: false})
      }

      if (isInspectHotkey(event) && !this.state.historyState.isOpen) {
        return this.handleToggleInspect()
      }

      if (isPublishHotkey(event)) {
        return this.handlePublishRequested()
      }

      if (isPreviewHotkey(event)) {
        const {draft, published} = this.getDocumentSnapshots()
        const item = getProductionPreviewItem({draft, published})
        return item && item.url && window.open(item.url)
      }

      return null
    }

    handlePublishRequested = () => {
      const {markers, validationPending, draft} = this.state
      if (!draft.snapshot) {
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

      this.handlePublish()
    }

    handleCancelUnpublish = () => {
      this.setState({showConfirmUnpublish: false})
    }

    handleCancelDelete = () => {
      this.setState({showConfirmDelete: false})
    }

    handleConfirmUnpublish = () => {
      this.handleUnpublish()
      this.setState({showConfirmUnpublish: false})
    }

    handleConfirmDelete = () => {
      this.handleDelete()
      this.setState({showConfirmDelete: false})
    }

    handleHideInspector = () => {
      this.setState({inspect: false})
    }

    handleMenuAction = item => {
      if (item.action === 'production-preview') {
        window.open(item.url)
        return true
      }

      if (item.action === 'delete') {
        this.setState({showConfirmDelete: true})
        return true
      }

      if (item.action === 'unpublish') {
        this.setState({showConfirmUnpublish: true})
        return true
      }

      if (item.action === 'duplicate') {
        this.handleCreateCopy()
        return true
      }

      if (item.action === 'inspect') {
        this.setState({inspect: true})
        return true
      }

      if (item.action === 'browseHistory') {
        this.handleOpenHistory()
        return true
      }

      this.setState({isMenuOpen: false})
      return false
    }

    handleCloseValidationResults = () => {
      this.setState({showValidationTooltip: false})
    }

    handleToggleValidationResults = () => {
      this.setState(prevState => ({showValidationTooltip: !prevState.showValidationTooltip}))
    }

    setHistoryState = nextHistoryState => {
      this.setState(prevState => ({historyState: {...prevState.historyState, ...nextHistoryState}}))
    }

    handleOpenHistory = () => {
      if (this.state.historyState.isOpen) {
        return
      }
      const {draft, published} = this.getDocumentSnapshots()
      this.setHistoryState({...INITIAL_HISTORY_STATE, isOpen: true})
      const events$ = historyStore.historyEventsFor(getPublishedId((draft || published)._id)).pipe(
        map((events, i) => {
          if (i === 0) {
            this.setHistoryState({isLoading: false, selectedRev: events[0].rev})
          }
          this.setHistoryState({events: events})
          return events
        })
      )

      this._historyEventsSubscription = events$.subscribe()
    }

    handleCloseHistory = () => {
      this._historyEventsSubscription.unsubscribe()
      this.setHistoryState({
        isOpen: false,
        historyEvent: undefined
      })
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
            this.setStateIfMounted({isPublishing: false, didPublish: true})
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
        this.setHistoryState(INITIAL_HISTORY_STATE)
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

    handleCreateCopy = () => {
      const {replaceCurrentPane} = this.context
      const {draft, published} = this.getDocumentSnapshots()
      const omitProps = ['_createdAt', '_updatedAt']

      const duplicatedDocument = this.isLiveEditEnabled()
        ? copyDocument(published, {omit: omitProps})
        : newDraftFrom(copyDocument(draft || published, {omit: omitProps}))

      this.duplicate$ = documentStore
        .create(duplicatedDocument)
        .subscribe(copied => replaceCurrentPane(getPublishedId(copied._id)))
    }

    handleMenuToggle = evt => {
      evt.stopPropagation()
      this.setState(prevState => ({isMenuOpen: !prevState.isMenuOpen}))
    }

    handleEditAsActualType = () => {
      const {navigateIntent} = this.context
      const {draft, published} = this.getDocumentSnapshots()
      navigateIntent('edit', {
        id: getPublishedId((draft || published)._id),
        type: draft._type || published._type
      })
    }

    handleSetFocus = path => {
      if (this.formRef.current) {
        this.formRef.current.handleFocus(path)
      }
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
            this.setStateIfMounted({isSaving: false, showSavingStatus: true})
            this.setSavingStatus()
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
        <div className={documentStyles.deletedDocument}>
          <div className={documentStyles.deletedDocumentInner}>
            <h3>This document just got deleted</h3>
            <p>You can undo deleting it until you close this window/tab</p>
            <Button onClick={this.handleRestoreDeleted}>Undo delete</Button>
          </div>
        </div>
      )
    }

    renderError(error) {
      return (
        <div className={documentStyles.error}>
          <div className={documentStyles.errorInner}>
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
                        className={documentStyles.errorDetails}
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
      const {draft, published} = this.getDocumentSnapshots()
      const typeName = options.type
      const doc = draft || published
      return (
        <div className={documentStyles.unknownSchemaType}>
          <div className={documentStyles.unknownSchemaTypeInner}>
            <h3>Unknown schema type</h3>
            <p>
              This document has the schema type <code>{typeName}</code>, which is not defined as a
              type in the local content studio schema.
            </p>
            {__DEV__ && doc && (
              <div>
                <h4>Here is the JSON representation of the document:</h4>
                <pre className={documentStyles.jsonDump}>
                  <code>{JSON.stringify(doc, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )
    }

    getTitle(value) {
      const {title: paneTitle, options} = this.props
      const typeName = options.type
      const type = schema.get(typeName)
      const {historyState} = this.state
      if (paneTitle) {
        return <span>{paneTitle}</span>
      }
      if (historyState.isOpen) {
        return (
          <>
            History of{' '}
            <PreviewFields document={value} type={type} fields={['title']}>
              {({title}) => (title ? <em>{title}</em> : <em>Untitled</em>)}
            </PreviewFields>
          </>
        )
      }
      if (!value) {
        return `New ${type.title || type.name}`
      }
      return (
        <PreviewFields document={value} type={type} fields={['title']}>
          {({title}) => (title ? <span>{title}</span> : <em>Untitled</em>)}
        </PreviewFields>
      )
    }

    renderPublishButtonTooltip = (errors, published) => {
      if (errors.length > 0) {
        return <span>Fix errors before publishing</span>
      }
      return (
        <span className={menuItemStyles.menuItem}>
          {published ? 'Publish changes' : 'Publish'}
          {errors.length < 1 && (
            <span className={menuItemStyles.hotkey}>
              <Hotkeys keys={['Ctrl', 'Alt', 'P']} />
            </span>
          )}
        </span>
      )
    }

    renderActions = () => {
      const {draft, published} = this.getDocumentSnapshots()
      const {markers, isReconnecting} = this.state
      const typeName = this.props.options.type
      const schemaType = schema.get(typeName)
      const {historyState, showSavingStatus, showValidationTooltip} = this.state
      if (historyState.isOpen) {
        return null
      }
      return (
        <Actions
          value={draft || published}
          markers={markers}
          type={schemaType}
          isLiveEditEnabled={this.isLiveEditEnabled()}
          isReconnecting={isReconnecting}
          showSavingStatus={showSavingStatus}
          showValidationTooltip={showValidationTooltip}
          onCloseValidationResults={this.handleCloseValidationResults}
          onToggleValidationResults={this.handleToggleValidationResults}
          onFocus={this.handleSetFocus}
        />
      )
    }

    renderWorkflowButtons = () => {
      const {draft, published} = this.getDocumentSnapshots()
      const {isCreatingDraft, isPublishing, isReconnecting, isUnpublishing, markers} = this.state
      const validation = markers.filter(marker => marker.type === 'validation')
      const errors = validation.filter(marker => marker.level === 'error')
      return (
        <>
          <Tooltip
            arrow
            theme="light"
            disabled={'ontouchstart' in document.documentElement}
            className={documentStyles.publishButton}
            html={this.renderPublishButtonTooltip(errors, published)}
          >
            <Button
              disabled={
                isCreatingDraft ||
                isPublishing ||
                isReconnecting ||
                isUnpublishing ||
                !draft ||
                errors.length > 0
              }
              onClick={this.handlePublishRequested}
              color="primary"
            >
              Publish
            </Button>
          </Tooltip>
          <div className={documentStyles.publishInfoUndoButton}>
            {!published && (
              <Button kind="simple" onClick={this.handleShowConfirmDelete}>
                Delete document
              </Button>
            )}
          </div>
        </>
      )
    }

    findSelectedEvent() {
      const {events, selectedRev} = this.state.historyState
      return events.find(
        event => event.rev === selectedRev || event.transactionIds.includes(selectedRev)
      )
    }

    renderHistoryFooter = () => {
      const {isReconnecting, isRestoring} = this.state
      const {historyState} = this.state
      const selectedEvent = this.findSelectedEvent()

      const isLatestEvent = historyState.events[0] === selectedEvent
      return (
        <>
          {isRestoring && (
            <div className={documentStyles.spinnerContainer}>
              <Spinner center message="Restoring revision…" />
            </div>
          )}
          <RestoreHistoryButton
            disabled={isRestoring || isReconnecting || isLatestEvent}
            onRestore={() =>
              this.handleRestore({id: selectedEvent.displayDocumentId, rev: selectedEvent.rev})
            }
          />
        </>
      )
    }

    renderFooter = () => {
      const {draft, published} = this.getDocumentSnapshots()
      const {initialValue} = this.props
      const value = draft || published || initialValue
      const {historyState} = this.state
      const onShowHistory = this.handleOpenHistory
      const spinnerMessage = getSpinnerMessage(this.props)
      const isLiveEditEnabled = this.isLiveEditEnabled()

      if (historyState.isOpen) {
        return <div className={documentStyles.footer}>{this.renderHistoryFooter()}</div>
      }

      return (
        <div className={documentStyles.footer}>
          <div className={documentStyles.footerStatus}>
            <div className={documentStyles.statusBadges}>
              <EditorStatusBadge
                liveEdit={isLiveEditEnabled}
                isDraft={!!draft}
                isPublished={!!published}
                title={
                  published &&
                  `Published ${distanceInWordsToNow(published._updatedAt, {
                    addSuffix: true
                  })}`
                }
              />
            </div>

            {value && value._updatedAt && (
              <div>
                <span className={documentStyles.editedTimeClickable} onClick={onShowHistory}>
                  {'Updated '}
                  <TimeAgo time={value._updatedAt} />
                </span>
              </div>
            )}
          </div>

          {spinnerMessage && (
            <div className={documentStyles.spinnerContainer}>
              <Spinner center message={spinnerMessage} />
            </div>
          )}

          <div className={documentStyles.publishInfo}>
            {!historyState.isOpen && draft && this.renderWorkflowButtons()}
          </div>
        </div>
      )
    }

    handleHistorySelect = event => {
      this.setHistoryState({
        selectedRev: event.rev
      })
    }

    handleSplitPane = () => {
      this.context.duplicateCurrentPane()
    }

    handleSetActiveView = (...args) => {
      this.context.setPaneView(...args)
    }

    handleShowConfirmDelete = () => {
      this.setState({showConfirmDelete: true})
    }

    handleClosePane = () => {
      this.context.closeCurrentPane()
    }

    getDocumentSnapshots() {
      const {draft, published} = this.state
      return {draft: draft.snapshot, published: published.snapshot}
    }

    getInitialValue() {
      const {draft, published} = this.state
      const typeName = this.props.options.type
      const base = {_type: typeName}
      return exists(draft, published) ? base : {...base, ...this.props.initialValue}
    }

    // eslint-disable-next-line complexity
    render() {
      const initialValue = this.getInitialValue()
      const {
        isSelected,
        isCollapsed,
        isClosable,
        onCollapse,
        onExpand,
        menuItemGroups,
        views,
        options,
        paneKey
      } = this.props

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
        isReconnecting,
        inspect,
        showConfirmDelete,
        showConfirmUnpublish,
        didPublish,
        historyState
      } = this.state

      const typeName = options.type
      const schemaType = schema.get(typeName)
      if (!schemaType) {
        return this.renderUnknownSchemaType()
      }

      if (isRecoverable(draft, published)) {
        return this.renderDeleted()
      }

      if (error) {
        return this.renderError(error)
      }

      const isLoading = draft.isLoading || published.isLoading

      if (isLoading) {
        return (
          <div className={documentStyles.loading}>
            <Spinner center message={`Loading ${schemaType.title}…`} delay={600} />
          </div>
        )
      }

      const activeViewId = this.context.getPaneView() || (views[0] && views[0].id)
      const activeView = views.find(view => view.id === activeViewId) || views[0] || {type: 'form'}
      const enabledActions = resolveEnabledActions(schemaType)
      const menuItems = getMenuItems({
        enabledActions,
        draft: draft.snapshot,
        published: published.snapshot,
        isLiveEditEnabled: this.isLiveEditEnabled(),
        isHistoryEnabled: historyState.isOpen,
        selectedEvent: historyState.isOpen && this.findSelectedEvent()
      })

      const documentProps = {
        patchChannel: this.patchChannel,
        type: schemaType,
        published: published.snapshot,
        draft: draft.snapshot,
        markers: markers || [],
        initialValue,
        validationPending,
        isRestoring,
        isSaving,
        isReconnecting,
        isPublishing,
        isUnpublishing,
        isCreatingDraft,
        history: {
          isOpen: historyState.isOpen,
          isLoading: historyState.isLoading,
          selectedEvent: this.findSelectedEvent(),
          selectedIsLatest: this.findSelectedEvent() === historyState.events[0]
        },
        onDelete: this.handleDelete,
        onPublish: this.handlePublish,
        onRestore: this.handleRestoreRevision,
        onUnpublish: this.handleUnpublish,
        onChange: this.handleChange
      }

      const value = draft.snapshot || published.snapshot

      return (
        <div
          className={
            historyState.isOpen ? documentStyles.paneWrapperWithHistory : documentStyles.paneWrapper
          }
        >
          {historyState.isOpen && (
            <History
              key="history"
              documentId={getPublishedId(value._id)}
              onClose={this.handleCloseHistory}
              onItemSelect={this.handleHistorySelect}
              lastEdited={value && new Date(value._updatedAt)}
              published={published}
              draft={draft}
              events={historyState.events}
              isLoading={historyState.isLoading}
              error={historyState.error}
              selectedEvent={this.findSelectedEvent()}
            />
          )}
          <TabbedPane
            key="pane"
            idPrefix={paneKey}
            title={this.getTitle(value)}
            views={views}
            activeView={activeViewId}
            onSetActiveView={this.handleSetActiveView}
            onSplitPane={this.handleSplitPane}
            onCloseView={this.handleClosePane}
            menuItemGroups={menuItemGroups}
            isSelected={isSelected}
            isCollapsed={isCollapsed}
            onCollapse={onCollapse}
            onExpand={onExpand}
            onAction={this.handleMenuAction}
            menuItems={menuItems}
            staticContent={this.renderFooter()}
            renderActions={this.renderActions}
            isClosable={isClosable}
            contentMaxWidth={672}
          >
            {activeView.type === 'form' && <FormView ref={this.formRef} {...documentProps} />}
            {activeView.type === 'component' && <activeView.component {...documentProps} />}
            {inspect && historyState.isOpen && (
              <InspectHistory
                id={value._id}
                event={this.findSelectedEvent()}
                onClose={this.handleHideInspector}
              />
            )}
            {inspect && (!historyState || !historyState.isOpen) && (
              <InspectView value={value} onClose={this.handleHideInspector} />
            )}
            {showConfirmDelete && (
              <ConfirmDelete
                draft={draft.snapshot}
                published={published.snapshot}
                onCancel={this.handleCancelDelete}
                onConfirm={this.handleConfirmDelete}
              />
            )}
            {showConfirmUnpublish && (
              <ConfirmUnpublish
                draft={draft.snapshot}
                published={published.snapshot}
                onCancel={this.handleCancelUnpublish}
                onConfirm={this.handleConfirmUnpublish}
              />
            )}
            {isReconnecting && (
              <Snackbar kind="warning" isPersisted title="Connection lost. Reconnecting…" />
            )}
            {didPublish && (
              <Snackbar
                kind="success"
                title="You just published:"
                timeout={3000}
                // eslint-disable-next-line react/jsx-no-bind
                onClose={() => this.setState({didPublish: false})}
                subtitle={<DocTitle document={value} />}
              />
            )}
            {transactionResult && transactionResult.type === 'error' && (
              <Snackbar
                kind="error"
                actionTitle="OK"
                onAction={this.handleClearTransactionResult}
                title={transactionResult.message}
                subtitle={<details>{transactionResult.error.message}</details>}
              />
            )}
          </TabbedPane>
        </div>
      )
    }
  }
)
