/* eslint-disable complexity */
import React from 'react'
import {noop} from 'lodash'
import {format, isToday, isYesterday} from 'date-fns'
import {from, Subscription} from 'rxjs'
import {map} from 'rxjs/operators'
import schema from 'part:@sanity/base/schema'
import Button from 'part:@sanity/components/buttons/default'
import {PreviewFields} from 'part:@sanity/base/preview'
import Spinner from 'part:@sanity/components/loading/spinner'
import historyStore from 'part:@sanity/base/datastore/history'
import TabbedPane from 'part:@sanity/components/panes/tabbed'
import Snackbar from 'part:@sanity/components/snackbar/default'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'
import UseState from '../../utils/UseState'
import InspectView from './InspectView'
import InspectHistory from './InspectHistory'
import {DocumentStatusBar, HistoryStatusBar} from './DocumentStatusBar'
import Delay from '../../utils/Delay'
import isNarrowScreen from '../../utils/isNarrowScreen'
import windowWidth$ from '../../utils/windowWidth'
import History from './History'
import _documentPaneStyles from './DocumentPane.css'
import FormView from './editor/FormView'
import {historyIsEnabled} from './editor/history'
import {getMenuItems, getProductionPreviewItem} from './documentPaneMenuItems'
import {PaneRouterContext} from '../../contexts/PaneRouterContext'
import {DocumentActionShortcuts} from './DocumentActionShortcuts'
import styles from './Editor.css'
import {Validation} from './editor/Validation'
import LanguageFilter from 'part:@sanity/desk-tool/language-select-component?'
import {DocumentOperationResults} from './DocumentOperationResults'

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
  hasNarrowScreen: boolean
  inspect: boolean

  isMenuOpen: boolean

  showValidationTooltip: boolean
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
  isMenuOpen: false,
  hasNarrowScreen: isNarrowScreen(),

  inspect: false,
  showValidationTooltip: false,
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
  connectionState: 'connecting' | 'connected' | 'reconnecting'
  isSelected: boolean
  isCollapsed: boolean
  markers: any[]
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
  presence: any
}

export default class DocumentPane extends React.PureComponent<Props, State> {
  _historyEventsSubscription?: Subscription
  _historyFetchDocSubscription?: Subscription
  resizeSubscriber?: Subscription
  _isMounted?: boolean
  subscription?: Subscription

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
        map(events => {
          this.setHistoryState({events, isLoading: false})
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

  renderActions = () => {
    const {options, markers} = this.props
    const {showValidationTooltip} = this.state
    if (this.historyIsOpen()) {
      return null
    }

    return (
      <div className={styles.paneFunctions}>
        {LanguageFilter && <LanguageFilter />}
        <Validation
          id={options.id}
          type={options.type}
          markers={markers}
          showValidationTooltip={showValidationTooltip}
          onCloseValidationResults={this.handleCloseValidationResults}
          onToggleValidationResults={this.handleToggleValidationResults}
          onFocus={this.handleSetFocus}
        />
      </div>
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

  renderHistoryFooter = selectedEvent => {
    const {events} = this.state.historyState
    const {options} = this.props

    return (
      <HistoryStatusBar
        id={options.id}
        type={options.type}
        selectedEvent={selectedEvent}
        isLatestEvent={events[0] === selectedEvent}
      />
    )
  }

  renderFooter = () => {
    const {initialValue, options} = this.props
    const value = this.props.value || initialValue

    return (
      <DocumentStatusBar
        id={options.id}
        type={options.type}
        lastUpdated={value && value._updatedAt}
        onLastUpdatedButtonClick={this.handleOpenHistory}
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
    const {
      views,
      options,
      urlParams,
      value,
      onChange,
      connectionState,
      markers,
      presence
    } = this.props
    const {hasNarrowScreen: isNarrowScreen, historical, historyState} = this.state

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
      connectionState,
      markers,
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
      presence,
      onChange
    }

    // Calculate the height of the header
    const hasTabs = views.length > 1
    const headerHeight = hasTabs ? 74 : 49

    switch (activeView.type) {
      case 'form':
        return (
          <FormView
            ref={this.formRef}
            id={formProps.documentId}
            {...formProps}
            headerHeight={headerHeight}
            isNarrowScreen={isNarrowScreen}
          />
        )
      case 'component':
        return <activeView.component {...viewProps} />
      default:
        return null
    }
  }

  render() {
    const {
      isSelected,
      value,
      isCollapsed,
      isClosable,
      onCollapse,
      connectionState,
      onExpand,
      menuItemGroups,
      views,
      options,
      paneKey
    } = this.props

    const {historical, hasNarrowScreen, inspect, historyState} = this.state

    const typeName = options.type
    const schemaType = schema.get(typeName)
    if (!schemaType) {
      return this.renderUnknownSchemaType()
    }

    if (connectionState === 'connecting') {
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
          footer={
            this.historyIsOpen() && selectedHistoryEvent
              ? this.renderHistoryFooter(selectedHistoryEvent)
              : this.renderFooter()
          }
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
          {connectionState === 'reconnecting' && (
            <Snackbar
              kind="warning"
              title="Connection lost. Reconnecting when online…"
              isPersisted
            />
          )}
          <DocumentOperationResults id={options.id} type={options.type} />
        </TabbedPane>
      </DocumentActionShortcuts>
    )
  }
}
