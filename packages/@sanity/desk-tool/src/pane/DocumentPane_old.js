/* eslint-disable complexity */
import React from 'react'
import PropTypes from 'prop-types'
import promiseLatest from 'promise-latest'
import {omit, noop, get, throttle, debounce} from 'lodash'
import {distanceInWordsToNow, format, isToday, isYesterday} from 'date-fns'
import {from, merge, concat, timer, of as observableOf} from 'rxjs'
import {catchError, switchMap, map, mapTo, tap} from 'rxjs/operators'
import {isActionEnabled, resolveEnabledActions} from 'part:@sanity/base/util/document-action-utils'
import schema from 'part:@sanity/base/schema'
import Button from 'part:@sanity/components/buttons/default'
import client from 'part:@sanity/base/client'
import {PreviewFields} from 'part:@sanity/base/preview'
import Spinner from 'part:@sanity/components/loading/spinner'
import historyStore from 'part:@sanity/base/datastore/history'
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
import DocumentStatusBar from '../components/DocumentStatusBar/index'
import Delay from '../utils/Delay'
import isNarrowScreen from '../utils/isNarrowScreen'
import windowWidth$ from '../utils/windowWidth'
import History from './History'
import documentPaneStyles from './styles/DocumentPane.css'
import FormView from './Editor/FormView'
import Actions from './Editor/Actions'
import {historyIsEnabled} from './Editor/history'
import menuItemStyles from './styles/documentPaneMenuItems.css'
import {getDocumentPaneFooterActions} from './documentPaneFooterActions'
import {getProductionPreviewItem, getMenuItems} from './documentPaneMenuItems'
import {validateDocument} from '@sanity/validation'

const DEBUG_HISTORY_TRANSITION = false
const CURRENT_REVISION_FLAG = '-'
const KEY_I = 73
const KEY_O = 79
const KEY_P = 80

function debugHistory(...args) {
  if (DEBUG_HISTORY_TRANSITION) {
    const logLine = typeof args[0] === 'string' ? `[HISTORY] ${args[0]}` : '[HISTORY] '
    // eslint-disable-next-line no-console
    console.log(logLine, ...args.slice(1))
  }
}

function isInspectHotkey(event) {
  return event.ctrlKey && event.keyCode === KEY_I && event.altKey && !event.shiftKey
}

function isPublishHotkey(event) {
  return event.ctrlKey && event.keyCode === KEY_P && event.altKey && !event.shiftKey
}

function isPreviewHotkey(event) {
  return event.ctrlKey && event.keyCode === KEY_O && event.altKey && !event.shiftKey
}

const isValidationError = marker => marker.type === 'validation' && marker.level === 'error'

const INITIAL_DOCUMENT_STATE = {
  isLoading: true,
  deletedSnapshot: null,
  snapshot: null
}

const INITIAL_HISTORICAL_DOCUMENT_STATE = {
  isLoading: false,
  snapshot: null,
  prevSnapshot: null
}

const INITIAL_HISTORY_STATE = {
  isEnabled: historyIsEnabled(),
  isLoading: true,
  error: null,
  events: []
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
  hasNarrowScreen: isNarrowScreen(),

  transactionResult: null,
  validationPending: true,
  inspect: false,
  showSavingStatus: false,
  showConfirmDelete: false,
  showConfirmUnpublish: false,
  showValidationTooltip: false,
  showConfirmDiscardDraft: false,

  draft: INITIAL_DOCUMENT_STATE,
  published: INITIAL_DOCUMENT_STATE,
  historical: INITIAL_HISTORICAL_DOCUMENT_STATE,

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
      }).isRequired,
      urlParams: PropTypes.shape({
        view: PropTypes.string,
        rev: PropTypes.string
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

    state = {...INITIAL_STATE, hasNarrowScreen: isNarrowScreen()}
    patchChannel = FormBuilder.createPatchChannel()
    formRef = React.createRef()

    constructor(props, context) {
      super(props)
      this.setup(props.options.id, context)
    }

    setup(documentId, context) {
      this.dispose()
      const publishedId = getPublishedId(documentId)
      const draftId = getDraftId(documentId)

      const {published, draft} = checkoutPair({publishedId, draftId})
      this.published = published
      this.draft = draft
      this.validateLatestDocument = debounce(promiseLatest(this.validateDocument, 300))

      if (this.props.urlParams.rev) {
        if (historyIsEnabled()) {
          this.handleFetchHistoricalDocument()
        } else {
          this.handleCloseHistory(context)
        }
      }

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

    getActiveViewId() {
      const views = this.props.views
      return this.context.params.view || (views[0] && views[0].id)
    }

    getDraftId() {
      return getDraftId(this.props.options.id)
    }

    getPublishedId() {
      return getPublishedId(this.props.options.id)
    }

    componentDidUpdate(prevProps, prevState) {
      if (prevProps.options.id !== this.props.options.id) {
        this.setup(this.props.options.id)
      }

      this.handleHistoryTransition(prevProps, prevState)
    }

    handleHistoryTransition(prevProps, prevState) {
      const next = this.props.urlParams
      const prev = prevProps.urlParams
      const selectedRev = next.rev
      const revChanged = next.rev !== prev.rev
      const {rev, ...params} = next

      const historyEvents = this.state.historyState.events
      const documentsAreLoaded = !this.state.draft.isLoading && !this.state.published.isLoading
      const wasNotLoaded = prevState.draft.isLoading || prevState.published.isLoading
      const historicalSnapshot = this.state.historical.snapshot
      const isLoadingSnapshot = this.state.historical.isLoading
      const shouldLoadHistoricalSnapshot =
        revChanged || (!isLoadingSnapshot && selectedRev && !historicalSnapshot)

      const shouldLoadHistory = Boolean(
        documentsAreLoaded && !wasNotLoaded && historyEvents.length === 0 && selectedRev
      )

      if (prevState.historyState.isEnabled && !this.state.historyState.isEnabled) {
        this.handleCloseHistory()
      }

      if (shouldLoadHistory) {
        debugHistory('Fetch history events')
        this.handleFetchHistoryEvents()
      }

      // A new revision was selected, and we're not currently loading the snapshot
      if (shouldLoadHistoricalSnapshot) {
        this.handleFetchHistoricalDocument(rev)
      }

      // Transitioned to a different document
      if (rev && prevProps.options.id !== this.props.options.id) {
        debugHistory('Document ID changed, remove revision from URL')
        // Tear out the revision from the URL, as well as the selected revision
        this.context.setParams(params, {recurseIfInherited: true})
        return
      }

      // History was closed
      if (!rev && prev.rev) {
        debugHistory('History closed, reset history state')
        this.setHistoryState(INITIAL_HISTORY_STATE)
        this.setState({historical: INITIAL_HISTORICAL_DOCUMENT_STATE})
      }
    }

    handleFetchHistoricalDocument(atRev) {
      const isCurrent = atRev === CURRENT_REVISION_FLAG
      if (isCurrent) {
        return
      }

      const event = atRev ? this.findHistoryEventByRev(atRev) : this.findSelectedHistoryEvent()
      if (!event) {
        debugHistory(
          'Could not find history event %s',
          atRev ? `for revision ${atRev}` : ' (selected)'
        )
        return
      }

      if (this._historyFetchDocSubscription) {
        this._historyFetchDocSubscription.unsubscribe()
      }

      this.setState(({historical}) => ({
        historical: {
          ...historical,
          snapshot: null,
          prevSnapshot: historical.snapshot || historical.prevSnapshot,
          isLoading: true
        }
      }))

      const {displayDocumentId: id, rev} = event

      debugHistory('Fetch historical document for rev %s', atRev)
      this._historyFetchDocSubscription = from(
        historyStore.getDocumentAtRevision(id, rev)
      ).subscribe(newSnapshot => {
        this.setState(({historical}) => ({
          historical: {...historical, isLoading: false, snapshot: newSnapshot, prevSnapshot: null}
        }))
      })
    }

    handleHistorySelect = event => {
      const paneContext = this.context

      const eventisCurrent = this.state.history.events[0] === event

      paneContext.setParams(
        {...paneContext.params, rev: eventisCurrent ? CURRENT_REVISION_FLAG : event.rev},
        {recurseIfInherited: true}
      )
    }

    handleSplitPane = () => {
      this.context.duplicateCurrent()
    }

    handleSetActiveView = (...args) => {
      this.context.setView(...args)
    }

    handleShowConfirmDelete = () => {
      this.setState({showConfirmDelete: true})
    }

    handleShowConfirmUnpublish = () => {
      this.setState({showConfirmUnpublish: true})
    }

    handleClosePane = () => {
      this.context.closeCurrent()
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

    canShowHistoryList() {
      return (
        this.context.siblingIndex === 0 &&
        !this.props.isCollapsed &&
        this.state.historyState.isEnabled
      )
    }

    componentDidMount() {
      this._isMounted = true

      this.resizeSubscriber = windowWidth$.subscribe(() => {
        const historyEnabled = historyIsEnabled()
        const hasNarrowScreen = isNarrowScreen()
        if (this.state.historyState.isEnabled !== historyEnabled) {
          this.setHistoryState({isEnabled: historyEnabled})
        }

        if (this.state.hasNarrowScreen !== hasNarrowScreen) {
          this.setState({hasNarrowScreen})
        }
      })
    }

    componentWillUnmount() {
      this._isMounted = false

      // Cancel throttled commit since draft will be nulled on unmount
      this.commit.cancel()

      // Instead, explicitly commit
      this.draft.commit().subscribe(() => {
        // todo: error handling
      })

      this.setSavingStatus.cancel()

      if (this.resizeSubscriber) {
        this.resizeSubscriber.unsubscribe()
      }

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

    historyIsOpen() {
      return Boolean(this.props.urlParams.rev)
    }

    canPublish() {
      const {markers, validationPending, draft} = this.state
      const {
        options: {type: typeName}
      } = this.props

      if (!draft.snapshot) {
        return false
      }

      const errors = markers.filter(isValidationError)
      const hasErrors = errors.length > 0
      if (validationPending || hasErrors) {
        return false
      }

      const type = schema.get(typeName)
      return isActionEnabled(type, 'publish')
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

      if (this._historyFetchDocSubscription) {
        this._historyFetchDocSubscription.unsubscribe()
      }

      this.published = null
      this.draft = null
    }

    handleToggleInspect = () => {
      const {draft, published} = this.state
      const value = draft.snapshot || published.snapshot
      if (!value) {
        return
      }

      this.setState(prevState => ({inspect: !prevState.inspect}))
    }

    handleKeyUp = event => {
      if (event.keyCode === 'Escape' && this.state.showValidationTooltip) {
        return this.setState({showValidationTooltip: false})
      }

      if (isInspectHotkey(event) && !this.historyIsOpen()) {
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

    handleDiscardDraft = () => {
      this.setState({showConfirmDiscardDraft: true})
    }

    handleConfirmDiscardDraft = () => {
      this.setState({showConfirmDiscardDraft: false})

      this.draft.delete()
      this.draft.commit().subscribe(() => {
        // todo: error handling
      })
    }

    handleCancelDiscardDraft = () => {
      this.setState({showConfirmDiscardDraft: false})
    }

    handlePublishRequested = () => {
      const {markers, validationPending} = this.state
      const errors = markers.filter(isValidationError)
      const hasErrors = errors.length > 0

      if (validationPending || hasErrors) {
        this.setState(prevState => ({
          showValidationTooltip: !prevState.showValidationTooltip
        }))
        return
      }

      if (!this.canPublish()) {
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

    setHistoryState = (nextHistoryState, cb = noop) => {
      this.setState(
        ({historyState: currentHistoryState}) => ({
          historyState: {...currentHistoryState, ...nextHistoryState}
        }),
        cb
      )
    }

    handleFetchHistoryEvents() {
      const {draft, published} = this.getDocumentSnapshots()

      if (this._historyEventsSubscription) {
        this._historyEventsSubscription.unsubscribe()
      }

      this._historyEventsSubscription = historyStore
        .historyEventsFor(getPublishedId((draft || published)._id))
        .pipe(
          map((events, i) => {
            const newState = i === 0 ? {events, isLoading: false} : {events}
            this.setHistoryState(newState)
            return events
          })
        )
        .subscribe()
    }

    handleOpenHistory = () => {
      if (!this.canShowHistoryList() || this.historyIsOpen()) {
        return
      }

      this.context.setParams(
        {...this.context.params, rev: CURRENT_REVISION_FLAG},
        {recurseIfInherited: true}
      )
    }

    handleCloseHistory = ctx => {
      const context = this.context || ctx
      if (this._historyEventsSubscription) {
        this._historyEventsSubscription.unsubscribe()
      }

      const {rev, ...params} = context.params
      if (rev) {
        // If there is a revision in the URL, remove it and let componentDidUpdate handle closing transition
        context.setParams(params, {recurseIfInherited: true})
      }
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
      if (!this.canPublish()) {
        return
      }

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

        const {rev: oldRev, ...params} = this.context.params
        const newRevision = get(nextState, 'transactionResult.result.transactionId')
        if (newRevision && oldRev) {
          // If there is a revision in the URL, replace it with the new one
          this.context.setParams({...params, rev: newRevision}, {recurseIfInherited: true})
        }
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
      const paneContext = this.context
      const {draft, published} = this.getDocumentSnapshots()
      const omitProps = ['_createdAt', '_updatedAt']

      const duplicatedDocument = this.isLiveEditEnabled()
        ? copyDocument(published, {omit: omitProps})
        : newDraftFrom(copyDocument(draft || published, {omit: omitProps}))

      this.duplicate$ = client.observable
        .create(duplicatedDocument)
        .subscribe(copied => paneContext.replaceCurrent({id: getPublishedId(copied._id)}))
    }

    handleMenuToggle = evt => {
      evt.stopPropagation()
      this.setState(prevState => ({isMenuOpen: !prevState.isMenuOpen}))
    }

    handleEditAsActualType = () => {
      const paneContext = this.context
      const {draft, published} = this.getDocumentSnapshots()
      paneContext.navigateIntent('edit', {
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
        <div className={documentPaneStyles.deletedDocument}>
          <div className={documentPaneStyles.deletedDocumentInner}>
            <h3>This document just got deleted</h3>
            <p>You can undo deleting it until you close this window/tab</p>
            <Button onClick={this.handleRestoreDeleted}>Undo delete</Button>
          </div>
        </div>
      )
    }

    renderError(error) {
      return (
        <div className={documentPaneStyles.error}>
          <div className={documentPaneStyles.errorInner}>
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
                        className={documentPaneStyles.errorDetails}
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
        <div className={documentPaneStyles.unknownSchemaType}>
          <div className={documentPaneStyles.unknownSchemaTypeInner}>
            <h3>Unknown schema type</h3>
            {typeName && (
              <p>
                This document has the schema type <code>{typeName}</code>, which is not defined as a
                type in the local content studio schema.
              </p>
            )}
            {!typeName && (
              <p>This document does not exist, and no schema type was specified for it.</p>
            )}
            {__DEV__ && doc && (
              <div>
                <h4>Here is the JSON representation of the document:</h4>
                <pre className={documentPaneStyles.jsonDump}>
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
      if (paneTitle) {
        return <span>{paneTitle}</span>
      }

      if (this.historyIsOpen()) {
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
      const {markers} = this.state
      const typeName = this.props.options.type
      const schemaType = schema.get(typeName)
      const {showValidationTooltip} = this.state
      if (this.historyIsOpen()) {
        return null
      }

      return (
        <Actions
          value={draft || published}
          markers={markers}
          type={schemaType}
          isLiveEditEnabled={this.isLiveEditEnabled()}
          showValidationTooltip={showValidationTooltip}
          onCloseValidationResults={this.handleCloseValidationResults}
          onToggleValidationResults={this.handleToggleValidationResults}
          onFocus={this.handleSetFocus}
        />
      )
    }

    findSelectedHistoryEvent() {
      const selectedRev = this.props.urlParams.rev
      return this.findHistoryEventByRev(selectedRev)
    }

    findHistoryEventByRev(rev) {
      const {events} = this.state.historyState
      return rev === CURRENT_REVISION_FLAG
        ? events[0]
        : events.find(event => event.rev === rev || event.transactionIds.includes(rev))
    }

    renderHistoryFooter = () => {
      const selectedEvent = this.findSelectedHistoryEvent()
      const {paneKey, options} = this.props
      const {historyState, isReconnecting, isRestoring} = this.state
      const isLatestEvent = historyState.events[0] === selectedEvent
      const historyStatus = selectedEvent ? (
        <>
          Changed <TimeAgo time={selectedEvent.endTime} /> {isLatestEvent && <> (latest)</>}
        </>
      ) : null

      const documentStatusProps = {
        actions: [
          {
            color: 'primary',
            disabled: isRestoring || isReconnecting || isLatestEvent,
            id: 'restore',
            label: 'Restore',
            handleClick: () => {
              this.handleRestoreRevision({
                id: selectedEvent.displayDocumentId,
                rev: selectedEvent.rev
              })
            }
          }
        ],
        historyStatus,
        idPrefix: paneKey,
        isSyncing: isRestoring
      }
      return <DocumentStatusBar id={options.id} type={options.type} {...documentStatusProps} />
    }

    renderFooter = () => {
      const {draft, published} = this.getDocumentSnapshots()
      const {initialValue, options, paneKey} = this.props
      const value = draft || published || initialValue
      const {
        isCreatingDraft,
        isPublishing,
        isReconnecting,
        isUnpublishing,
        markers,
        showSavingStatus,
        showConfirmDiscardDraft
      } = this.state

      const validation = markers.filter(marker => marker.type === 'validation')
      const errors = validation.filter(marker => marker.level === 'error')
      const onShowHistory = this.handleOpenHistory
      const isLiveEditEnabled = this.isLiveEditEnabled()
      const canShowHistory = this.canShowHistoryList()

      // get enabled actions value
      const typeName = options.type
      const schemaType = schema.get(typeName)
      const enabledActions = resolveEnabledActions(schemaType)

      const badges = [
        !isLiveEditEnabled &&
          published && {
            id: 'published',
            label: 'Published',
            color: 'success',
            title: `Published ${distanceInWordsToNow(published._updatedAt, {
              addSuffix: true
            })}`
          },
        !isLiveEditEnabled && draft && {id: 'draft', label: 'Draft', color: 'warning'},
        isLiveEditEnabled && {id: 'live', label: 'Live', color: 'danger'}
      ].filter(Boolean)

      const actions = getDocumentPaneFooterActions({
        draft,
        enabledActions,
        errors,
        handlers: {
          discardChanges: this.handleDiscardDraft,
          publish: this.handlePublishRequested,
          unpublish: this.handleShowConfirmUnpublish,
          duplicate: this.handleCreateCopy,
          delete: this.handleShowConfirmDelete
        },
        isCreatingDraft,
        isLiveEditEnabled,
        isPublishing,
        isReconnecting,
        isUnpublishing,
        published
      })

      const historyStatus =
        value && value._updatedAt ? (
          <>
            Updated <TimeAgo time={value._updatedAt} />
          </>
        ) : (
          <>Empty</>
        )

      let confirmationDialog
      if (showConfirmDiscardDraft) {
        confirmationDialog = {
          message: (
            <>
              <strong>Are you sure</strong> you want to discard all changes since last published?
            </>
          ),
          confirmText: 'Discard',
          handleConfirm: this.handleConfirmDiscardDraft,
          handleCancel: this.handleCancelDiscardDraft
        }
      }

      const documentStatusProps = {
        badges,
        actions,
        historyStatus,
        idPrefix: paneKey,
        isDisconnected: isReconnecting,
        isHistoryAvailable: canShowHistory,
        isSyncing: showSavingStatus,
        onHistoryStatusClick: onShowHistory,
        confirmationDialog
      }

      return <DocumentStatusBar id={options.id} type={options.type} {...documentStatusProps} />
    }

    getHistoryEventDateString() {
      const event = this.findSelectedHistoryEvent()
      const dateFormat = 'MMM D, YYYY, hh:mm A'
      const date = event && event.endTime
      if (!date) {
        return ''
      }

      if (isToday(date)) {
        return `Today, ${format(date, 'hh:mm A')}`
      }
      if (isYesterday(date)) {
        return `Yesterday, ${format(date, 'hh:mm A')}`
      }
      return format(date, dateFormat)
    }

    renderHistorySpinner() {
      const isLoading = this.state.historical.isLoading
      if (!isLoading) {
        return null
      }

      const eventDate = this.getHistoryEventDateString()
      return (
        <Delay ms={600}>
          <div className={documentPaneStyles.spinnerContainer}>
            <Spinner center message={`Loading revision${eventDate ? ` from ${eventDate}` : ''}…`} />
          </div>
        </Delay>
      )
    }

    renderCurrentView() {
      const initialValue = this.getInitialValue()
      const {views, options, urlParams} = this.props
      const {
        draft,
        published,
        historical,
        markers,
        isCreatingDraft,
        isUnpublishing,
        isPublishing,
        isRestoring,
        isSaving,
        validationPending,
        isReconnecting,
        historyState
      } = this.state

      const selectedHistoryEvent = this.findSelectedHistoryEvent()

      const typeName = options.type
      const schemaType = schema.get(typeName)

      const activeViewId = this.getActiveViewId()
      const activeView = views.find(view => view.id === activeViewId) || views[0] || {type: 'form'}

      const selectedIsLatest =
        urlParams.rev === CURRENT_REVISION_FLAG && selectedHistoryEvent === historyState.events[0]

      // Should be null if not displaying a historical revision
      const historicalSnapshot = selectedIsLatest
        ? draft.snapshot || published.snapshot
        : historical.snapshot || historical.prevSnapshot

      const viewProps = {
        // "Documents"
        document: {
          published: published.snapshot,
          draft: draft.snapshot,
          historical: historicalSnapshot,
          displayed: historicalSnapshot || draft.snapshot || published.snapshot || initialValue
        },

        // Other stuff
        documentId: this.getPublishedId(),
        options: activeView.options,
        schemaType,
        markers: markers || []
      }

      const formProps = {
        ...viewProps,

        patchChannel: this.patchChannel,
        initialValue,
        validationPending,
        isRestoring,
        isSaving,
        isReconnecting,
        isPublishing,
        isUnpublishing,
        isCreatingDraft,
        history: {
          isOpen: this.historyIsOpen(),
          selectedEvent: selectedHistoryEvent,
          isLoadingEvents: historyState.isLoading,
          isLoadingSnapshot: historical.isLoading,
          document: selectedIsLatest
            ? {
                isLoading: !selectedHistoryEvent,
                snapshot: draft.snapshot || published.snapshot
              }
            : historical
        },
        onDelete: this.handleDelete,
        onPublish: this.handlePublish,
        onRestore: this.handleRestoreRevision,
        onUnpublish: this.handleUnpublish,
        onChange: this.handleChange
      }

      switch (activeView.type) {
        case 'form':
          return <FormView ref={this.formRef} id={formProps.documentId} {...formProps} />
        case 'component':
          return <activeView.component {...viewProps} />
        default:
          return null
      }
    }

    // eslint-disable-next-line complexity
    render() {
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
        historical,
        transactionResult,
        error,
        hasNarrowScreen,
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
          <div className={documentPaneStyles.loading}>
            <Spinner center message={`Loading ${schemaType.title}…`} delay={600} />
          </div>
        )
      }

      const selectedHistoryEvent = this.findSelectedHistoryEvent()
      const enabledActions = resolveEnabledActions(schemaType)
      const historyIsOpen = this.historyIsOpen()
      const menuItems = getMenuItems({
        enabledActions,
        draft: draft.snapshot,
        published: published.snapshot,
        isLiveEditEnabled: this.isLiveEditEnabled(),
        isHistoryEnabled: historyIsOpen,
        selectedEvent: historyIsOpen && selectedHistoryEvent,
        canShowHistoryList: this.canShowHistoryList()
      })

      const value = draft.snapshot || published.snapshot

      return (
        <div
          onKeyUp={this.handleKeyUp}
          className={
            this.historyIsOpen()
              ? documentPaneStyles.paneWrapperWithHistory
              : documentPaneStyles.paneWrapper
          }
        >
          {this.historyIsOpen() && this.canShowHistoryList() && (
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
              selectedEvent={selectedHistoryEvent}
            />
          )}
          <TabbedPane
            key="pane"
            idPrefix={paneKey}
            title={this.getTitle(value)}
            views={views}
            activeView={this.getActiveViewId()}
            onSetActiveView={this.handleSetActiveView}
            onSplitPane={hasNarrowScreen ? undefined : this.handleSplitPane}
            onCloseView={this.handleClosePane}
            menuItemGroups={menuItemGroups}
            isSelected={isSelected}
            isCollapsed={isCollapsed}
            onCollapse={onCollapse}
            onExpand={onExpand}
            onAction={this.handleMenuAction}
            menuItems={menuItems}
            footer={this.historyIsOpen() ? this.renderHistoryFooter() : this.renderFooter()}
            renderActions={this.renderActions}
            isClosable={isClosable}
            hasSiblings={this.context.hasGroupSiblings}
          >
            {this.renderHistorySpinner()}
            {this.renderCurrentView()}
            {inspect && this.historyIsOpen() && historical && (
              <InspectHistory document={historical} onClose={this.handleHideInspector} />
            )}
            {inspect && !this.historyIsOpen() && value && (
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
