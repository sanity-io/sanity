/* eslint-disable complexity */
import React from 'react'
import {get, noop} from 'lodash'
import {format, isToday, isYesterday} from 'date-fns'
import {concat, from, of as observableOf, Subscription} from 'rxjs'
import {catchError, map} from 'rxjs/operators'
import schema from 'part:@sanity/base/schema'
import Button from 'part:@sanity/components/buttons/default'
import client from 'part:@sanity/base/client'
import {PreviewFields} from 'part:@sanity/base/preview'
import Spinner from 'part:@sanity/components/loading/spinner'
import historyStore from 'part:@sanity/base/datastore/history'
import TabbedPane from 'part:@sanity/components/panes/tabbed'
import Snackbar from 'part:@sanity/components/snackbar/default'
import Hotkeys from 'part:@sanity/components/typography/hotkeys'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'
import UseState from '../utils/UseState'
import InspectView from '../components/InspectView'
import InspectHistory from '../components/InspectHistory'
import TimeAgo from '../components/TimeAgo'
import DocumentStatusBar from '../components/DocumentStatusBar'
import Delay from '../utils/Delay'
import isNarrowScreen from '../utils/isNarrowScreen'
import windowWidth$ from '../utils/windowWidth'
import History from './History'
import _documentPaneStyles from './styles/DocumentPane.css'
import FormView from './Editor/FormView'
import Actions from './Editor/Actions'
import {historyIsEnabled} from './Editor/history'
import menuItemStyles from './styles/documentPaneMenuItems.css'
import {getProductionPreviewItem} from './documentPaneMenuItems'
import {validateDocument} from '@sanity/validation'
import {PaneRouterContext} from '..'
import {HistoryStatusBarActions} from '../components/DocumentStatusBar/DocumentStatusBarActions'
import {getMenuItems} from './documentPaneMenuItems'
import {DocumentActionShortcuts} from '../components/DocumentActionShortcuts'

declare const __DEV__: boolean

const documentPaneStyles: any = _documentPaneStyles

const DEBUG_HISTORY_TRANSITION = false
const CURRENT_REVISION_FLAG = '-'
const KEY_I = 73
const KEY_O = 79

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

function isPreviewHotkey(event) {
  return event.ctrlKey && event.keyCode === KEY_O && event.altKey && !event.shiftKey
}

interface Doc {
  _id: string
  _type: string
  _rev: string
  _updatedAt: string
}

interface Marker {
  level: string
  type: string
}

interface HistoricalDocumentState {
  isLoading: boolean
  snapshot: null | Doc
  prevSnapshot: null | Doc
}

interface HistoryState {
  isEnabled: boolean
  isLoading: boolean
  error: null | Error
  events: any[]
}

interface State {
  historical: HistoricalDocumentState
  historyState: HistoryState
  history: any
  transactionResult: null | {error: Error; type: string; message: string}
  error?: null | Error
  hasNarrowScreen: boolean
  inspect: boolean

  isCreatingDraft: boolean
  isMenuOpen: boolean
  isRestoring: boolean

  validationPending: boolean
  showSavingStatus: boolean
  showValidationTooltip: boolean
  showConfirmDiscardDraft: boolean
}

const INITIAL_HISTORICAL_DOCUMENT_STATE: HistoricalDocumentState = {
  isLoading: false,
  snapshot: null,
  prevSnapshot: null
}

const INITIAL_HISTORY_STATE: HistoryState = {
  isEnabled: historyIsEnabled(),
  isLoading: true,
  error: null,
  events: []
}

const INITIAL_STATE: State = {
  error: null,

  isCreatingDraft: false,
  isMenuOpen: false,
  isRestoring: false,
  hasNarrowScreen: isNarrowScreen(),

  transactionResult: null,
  validationPending: true,
  inspect: false,
  showSavingStatus: false,
  showValidationTooltip: false,
  showConfirmDiscardDraft: false,
  historical: INITIAL_HISTORICAL_DOCUMENT_STATE,
  historyState: INITIAL_HISTORY_STATE,
  history: {}
}

interface Props {
  styles?: {error?: string; errorInner?: string}
  title?: string
  paneKey: string
  type: any
  published: null | Doc
  draft: null | Doc
  value: null | Doc
  markers: Marker[]
  isLoading: boolean
  isConnected: boolean
  isSyncing: boolean
  isSelected: boolean
  isCollapsed: boolean
  onChange: (patches: any[]) => void
  isClosable: boolean
  onExpand?: () => void
  onCollapse?: () => void
  menuItems: {title: string}[]
  menuItemGroups: {id: string}[]
  views: {
    type: string
    id: string
    title: string
    options: {}
    component: React.ComponentType<any>
  }[]
  initialValue?: {[field: string]: any}
  options: {
    id: string
    type: string
    template?: string
  }
  urlParams: {
    view: string
    rev: string
  }
}

type CancellableFunc = (() => void) & {cancel: () => void}

export default class DocumentPane extends React.PureComponent<Props, State> {
  _historyEventsSubscription?: Subscription
  _historyFetchDocSubscription?: Subscription
  duplicateSubscription?: Subscription
  resizeSubscriber?: Subscription
  _isMounted?: boolean
  subscription?: Subscription
  validateLatestDocument?: CancellableFunc

  static contextType = PaneRouterContext

  static defaultProps = {
    title: '',
    views: [],
    menuItems: [],
    menuItemGroups: []
  }

  state = {...INITIAL_STATE, hasNarrowScreen: isNarrowScreen()}
  formRef: React.RefObject<HTMLFormElement> = React.createRef()

  constructor(props, context) {
    super(props)
    this.setup(props.options.id, context)
  }

  setup(documentId, context?) {
    this.dispose()

    if (this.props.urlParams.rev) {
      if (historyIsEnabled()) {
        this.handleFetchHistoricalDocument()
      } else {
        this.handleCloseHistory(context)
      }
    }
  }

  validateDocument = async () => {
    const {draft, published} = this.props
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
    const historicalSnapshot = this.state.historical.snapshot
    const isLoadingSnapshot = this.state.historical.isLoading
    const shouldLoadHistoricalSnapshot =
      revChanged || (!isLoadingSnapshot && selectedRev && !historicalSnapshot)

    const shouldLoadHistory = Boolean(historyEvents.length === 0 && selectedRev)

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

  handleFetchHistoricalDocument(atRev?) {
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
    this._historyFetchDocSubscription = from(historyStore.getDocumentAtRevision(id, rev)).subscribe(
      (newSnapshot: any) => {
        this.setState(({historical}) => ({
          historical: {...historical, isLoading: false, snapshot: newSnapshot, prevSnapshot: null}
        }))
      }
    )
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

  handleClosePane = () => {
    this.context.closeCurrent()
  }

  getInitialValue() {
    const {value} = this.props
    const typeName = this.props.options.type
    const base = {_type: typeName}
    return value ? base : {...base, ...this.props.initialValue}
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

    if (this.resizeSubscriber) {
      this.resizeSubscriber.unsubscribe()
    }

    this.dispose()
  }

  isLiveEditEnabled() {
    const selectedSchemaType = schema.get(this.props.options.type)
    return selectedSchemaType.liveEdit === true
  }

  historyIsOpen() {
    return Boolean(this.props.urlParams.rev)
  }

  dispose() {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = undefined
    }

    if (this.validateLatestDocument) {
      this.validateLatestDocument.cancel()
      this.validateLatestDocument = undefined
    }

    if (this.duplicateSubscription) {
      this.duplicateSubscription.unsubscribe()
    }

    if (this._historyEventsSubscription) {
      this._historyEventsSubscription.unsubscribe()
    }

    if (this._historyFetchDocSubscription) {
      this._historyFetchDocSubscription.unsubscribe()
    }
  }

  handleToggleInspect = () => {
    const {value} = this.props
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

    if (isPreviewHotkey(event)) {
      //todo
      const {draft, published} = this.props
      const item = getProductionPreviewItem({draft, published})
      return item && item.url && window.open(item.url)
    }

    return null
  }

  handleHideInspector = () => {
    this.setState({inspect: false})
  }

  handleMenuAction = item => {
    if (item.action === 'production-preview') {
      window.open(item.url)
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
    const {options} = this.props

    if (this._historyEventsSubscription) {
      this._historyEventsSubscription.unsubscribe()
    }

    this._historyEventsSubscription = historyStore
      .historyEventsFor(getPublishedId(options.id))
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

  handleCloseHistory = (ctx?) => {
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
    ).subscribe((nextState: any) => {
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

  handleMenuToggle = evt => {
    evt.stopPropagation()
    this.setState(prevState => ({isMenuOpen: !prevState.isMenuOpen}))
  }

  handleEditAsActualType = () => {
    const paneContext = this.context
    const {value} = this.props
    if (!value) {
      throw new Error("Can't navigate to unknown document")
    }
    paneContext.navigateIntent('edit', {
      id: getPublishedId(value._id),
      type: value._type
    })
  }

  handleSetFocus = path => {
    if (this.formRef.current) {
      this.formRef.current.handleFocus(path)
    }
  }

  setStateIfMounted: React.Component['setState'] = (...args) => {
    if (!this._isMounted) {
      return
    }

    this.setState(...args)
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
    const {value} = this.props
    const typeName = options.type
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
          {__DEV__ && value && (
            <div>
              <h4>Here is the JSON representation of the document:</h4>
              <pre>
                <code>{JSON.stringify(value, null, 2)}</code>
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
    const {value, markers} = this.props
    const typeName = this.props.options.type
    const schemaType = schema.get(typeName)
    const {showValidationTooltip} = this.state
    if (this.historyIsOpen()) {
      return null
    }

    return (
      <Actions
        value={value}
        markers={markers}
        type={schemaType}
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
    const {options} = this.props

    return historyIsEnabled && selectedEvent ? (
      <HistoryStatusBarActions
        id={options.id}
        type={options.type}
        historyId={selectedEvent.displayDocumentId}
        revision={selectedEvent.rev}
      />
    ) : (
      <DocumentStatusBar id={options.id} type={options.type} />
    )
  }

  renderFooter = () => {
    const {initialValue, options} = this.props
    const value = this.props.value || initialValue

    const canShowHistory = this.canShowHistoryList()

    const historyStatus =
      value && value._updatedAt ? (
        <>
          Updated <TimeAgo time={value._updatedAt} />
        </>
      ) : (
        <></>
      )

    return (
      <DocumentStatusBar
        id={options.id}
        type={options.type}
        historyStatus={historyStatus}
        isHistoryAvailable={canShowHistory}
        onHistoryStatusClick={this.handleOpenHistory}
      />
    )
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
    const {views, options, urlParams, value, onChange, isConnected} = this.props
    const {historical, isCreatingDraft, isRestoring, validationPending, historyState} = this.state

    const selectedHistoryEvent = this.findSelectedHistoryEvent()

    const typeName = options.type
    const schemaType = schema.get(typeName)

    const activeViewId = this.getActiveViewId()
    const activeView = views.find(view => view.id === activeViewId) || views[0] || {type: 'form'}

    const selectedIsLatest =
      urlParams.rev === CURRENT_REVISION_FLAG && selectedHistoryEvent === historyState.events[0]

    // Should be null if not displaying a historical revision
    const historicalSnapshot = selectedIsLatest
      ? value
      : historical.snapshot || historical.prevSnapshot

    const viewProps = {
      // "Documents"
      document: {
        published: value,
        draft: value,
        historical: historicalSnapshot,
        displayed: historicalSnapshot || value || initialValue
      },

      // Other stuff
      documentId: this.getPublishedId(),
      options: activeView.options,
      schemaType
    }

    const formProps = {
      ...viewProps,
      value: value,
      validationPending,
      isRestoring,
      isConnected,
      isCreatingDraft,
      history: {
        isOpen: this.historyIsOpen(),
        selectedEvent: selectedHistoryEvent,
        isLoadingEvents: historyState.isLoading,
        isLoadingSnapshot: historical.isLoading,
        document: selectedIsLatest
          ? {
              isLoading: !selectedHistoryEvent,
              snapshot: value
            }
          : historical
      },
      onDelete: this.handleDelete,
      onRestore: this.handleRestoreRevision,
      onChange
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

  render() {
    const {
      isSelected,
      isLoading,
      value,
      isCollapsed,
      isClosable,
      onCollapse,
      isConnected,
      onExpand,
      menuItemGroups,
      views,
      options,
      paneKey
    } = this.props

    const {
      historical,
      transactionResult,
      error,
      hasNarrowScreen,
      inspect,
      historyState
    } = this.state

    const typeName = options.type
    const schemaType = schema.get(typeName)
    if (!schemaType) {
      return this.renderUnknownSchemaType()
    }

    if (error) {
      return this.renderError(error)
    }

    if (isLoading) {
      return (
        <div className={documentPaneStyles.loading}>
          <Spinner center message={`Loading ${schemaType.title}…`} delay={600} />
        </div>
      )
    }

    const selectedHistoryEvent = this.findSelectedHistoryEvent()
    const menuItems = getMenuItems({
      value,
      isLiveEditEnabled: this.isLiveEditEnabled(),
      revision: selectedHistoryEvent && selectedHistoryEvent._rev,
      canShowHistoryList: this.canShowHistoryList()
    })

    return (
      <DocumentActionShortcuts
        id={options.id}
        type={typeName}
        className={
          this.historyIsOpen()
            ? documentPaneStyles.paneWrapperWithHistory
            : documentPaneStyles.paneWrapper
        }
      >
        {this.historyIsOpen() && this.canShowHistoryList() && (
          <History
            key="history"
            documentId={getPublishedId(options.id)}
            onClose={this.handleCloseHistory}
            onItemSelect={this.handleHistorySelect}
            lastEdited={value && new Date(value._updatedAt)}
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
          {!isConnected && (
            <Snackbar kind="warning" isPersisted title="Connection lost. Reconnecting…" />
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
      </DocumentActionShortcuts>
    )
  }
}
