/* eslint-disable complexity, camelcase, max-params */
// Connects the FormBuilder with various sanity roles
import React from 'react'
import PropTypes from 'prop-types'
import {debounce} from 'lodash'
import {Tooltip} from 'react-tippy'
import {withRouterHOC} from 'part:@sanity/base/router'
import {PreviewFields} from 'part:@sanity/base/preview'
import {getPublishedId, newDraftFrom} from 'part:@sanity/base/util/draft-utils'
import historyStore from 'part:@sanity/base/datastore/history'
import {isActionEnabled, resolveEnabledActions} from 'part:@sanity/base/util/document-action-utils'
import Spinner from 'part:@sanity/components/loading/spinner'
import Button from 'part:@sanity/components/buttons/default'
import TrashIcon from 'part:@sanity/base/trash-icon'
import PublicIcon from 'part:@sanity/base/public-icon'
import VisibilityOffIcon from 'part:@sanity/base/visibility-off-icon'
import BinaryIcon from 'part:@sanity/base/binary-icon'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'
import documentStore from 'part:@sanity/base/datastore/document'
import schema from 'part:@sanity/base/schema'
import Pane from 'part:@sanity/components/panes/default'
import afterEditorComponents from 'all:part:@sanity/desk-tool/after-editor-component'
import CheckCircleIcon from 'part:@sanity/base/circle-check-icon'
import HistoryIcon from 'part:@sanity/base/history-icon'
import Snackbar from 'part:@sanity/components/snackbar/default'
import resolveProductionPreviewUrl from 'part:@sanity/transitional/production-preview/resolve-production-url?'
import WarningIcon from 'part:@sanity/base/warning-icon'
import filterFieldFn$ from 'part:@sanity/desk-tool/filter-fields-fn?'
import Hotkeys from 'part:@sanity/components/typography/hotkeys'
import copyDocument from '../../utils/copyDocument'
import ConfirmUnpublish from '../../components/ConfirmUnpublish'
import ConfirmDelete from '../../components/ConfirmDelete'
import InspectView from '../../components/InspectView'
import InspectHistory from '../../components/InspectHistory'
import DocTitle from '../../components/DocTitle'
import History from '../History'
import styles from '../styles/Editor.css'
import Actions from './Actions'
import RestoreHistoryButton from './RestoreHistoryButton'
import EditForm from './EditForm'
import HistoryForm from './HistoryForm'
import {map} from 'rxjs/operators'

const BREAKPOINT_SCREEN_MEDIUM = 512

function navigateUrl(url) {
  window.open(url)
}

// Want a nicer api for listen/unlisten
function listen(target, eventType, callback, useCapture = false) {
  target.addEventListener(eventType, callback, useCapture)
  return function unlisten() {
    target.removeEventListener(eventType, callback, useCapture)
  }
}

const getDuplicateItem = (draft, published, isLiveEditEnabled, isHistoryEnabled) => ({
  action: 'duplicate',
  title: 'Duplicate',
  icon: ContentCopyIcon,
  isDisabled: isHistoryEnabled || (!draft && !published)
})

const getUnpublishItem = (draft, published, isLiveEditEnabled, isHistoryEnabled) =>
  isLiveEditEnabled
    ? null
    : {
        action: 'unpublish',
        title: 'Unpublish…',
        icon: VisibilityOffIcon,
        isDisabled: isHistoryEnabled || !published
      }

const getDeleteItem = (draft, published, isLiveEditEnabled, isHistoryEnabled) => ({
  group: 'danger',
  action: 'delete',
  title: 'Delete…',
  icon: TrashIcon,
  danger: true,
  isDisabled: isHistoryEnabled || (!draft && !published)
})

const getHistoryMenuItem = (draft, published, isLiveEditEnabled, isHistoryEnabled) => {
  if (isLiveEditEnabled) {
    return null
  }
  if (window && window.innerWidth > BREAKPOINT_SCREEN_MEDIUM) {
    return {
      action: 'browseHistory',
      title: 'Browse history',
      icon: HistoryIcon,
      isDisabled: isHistoryEnabled || !(draft || published)
    }
  }
  return null
}

const getInspectItem = (draft, published) => ({
  action: 'inspect',
  title: (
    <span className={styles.menuItem}>
      Inspect{' '}
      <span className={styles.hotkey}>
        <Hotkeys keys={['Ctrl', 'Alt', 'I']} />
      </span>
    </span>
  ),
  icon: BinaryIcon,
  isDisabled: !(draft || published)
})

const getProductionPreviewItem = (
  draft,
  published,
  liveEditEnable,
  isHistoryEnabled,
  selectedEvent
) => {
  const snapshot = draft || published
  if (!snapshot || !resolveProductionPreviewUrl) {
    return null
  }
  let previewUrl
  try {
    previewUrl = resolveProductionPreviewUrl(snapshot, selectedEvent && selectedEvent.rev)
  } catch (error) {
    error.message = `An error was thrown while trying to get production preview url: ${error.message}`
    // eslint-disable-next-line no-console
    console.error(error)
    return null
  }

  return (
    previewUrl && {
      action: 'production-preview',
      title: (
        <span className={styles.menuItem}>
          Open preview
          <span className={styles.hotkey}>
            <Hotkeys keys={['Ctrl', 'Alt', 'O']} />
          </span>
        </span>
      ),
      icon: PublicIcon,
      url: previewUrl
    }
  )
}

const getMenuItems = (
  enabledActions,
  draft,
  published,
  isLiveEditEnabled,
  isHistoryEnabled,
  selectedEvent
) =>
  [
    getProductionPreviewItem,
    enabledActions.includes('delete') && getUnpublishItem,
    enabledActions.includes('create') && getDuplicateItem,
    getHistoryMenuItem,
    getInspectItem,
    enabledActions.includes('delete') && getDeleteItem
  ]
    .filter(Boolean)
    .map(fn => fn(draft, published, isLiveEditEnabled, isHistoryEnabled, selectedEvent))
    .filter(Boolean)

const isValidationError = marker => marker.type === 'validation' && marker.level === 'error'

const INITIAL_HISTORY_STATE = {
  isOpen: false,
  isLoading: true,
  error: null,
  events: [],
  selectedRev: null
}

const INITIAL_STATE = {
  inspect: false,
  isMenuOpen: false,
  isCreatingDraft: false,
  showSavingStatus: false,
  showConfirmDelete: false,
  showConfirmUnpublish: false,
  showValidationTooltip: false,
  focusPath: [],
  historyState: INITIAL_HISTORY_STATE,
  filterField: () => true
}

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

export default withRouterHOC(
  // eslint-disable-next-line
  class Editor extends React.PureComponent {
    static propTypes = {
      title: PropTypes.string,
      paneIndex: PropTypes.number.isRequired,
      index: PropTypes.number,
      paneStyles: PropTypes.object,
      patchChannel: PropTypes.object,
      draft: PropTypes.object,
      published: PropTypes.object,
      initialValue: PropTypes.object,
      type: PropTypes.object.isRequired,
      markers: PropTypes.arrayOf(
        PropTypes.shape({
          path: PropTypes.array
        })
      ),
      router: PropTypes.shape({
        state: PropTypes.object,
        navigate: PropTypes.func,
        navigateIntent: PropTypes.func
      }).isRequired,

      onDelete: PropTypes.func,
      onChange: PropTypes.func,
      onPublish: PropTypes.func,
      onRestore: PropTypes.func,
      onUnpublish: PropTypes.func,
      transactionResult: PropTypes.shape({
        type: PropTypes.string,
        error: PropTypes.object,
        message: PropTypes.string
      }),
      onClearTransactionResult: PropTypes.func,

      validationPending: PropTypes.bool,
      isCreatingDraft: PropTypes.bool,
      isUnpublishing: PropTypes.bool,
      isPublishing: PropTypes.bool,
      isReconnecting: PropTypes.bool,
      isRestoring: PropTypes.bool,
      isLoading: PropTypes.bool,
      isSaving: PropTypes.bool
    }

    static defaultProps = {
      title: null,
      markers: [],
      isLoading: false,
      isSaving: false,
      isUnpublishing: false,
      isPublishing: false,
      isReconnecting: false,
      isRestoring: false,
      isCreatingDraft: false,
      transactionResult: null,
      onDelete() {},
      onChange() {},
      onClearTransactionResult() {}
    }

    state = INITIAL_STATE

    componentDidMount() {
      this.unlistenForKey = listen(window, 'keyup', event => {
        if (event.code === 'Escape' && this.state.showValidationTooltip) {
          this.setState({showValidationTooltip: false})
          return
        }

        if (
          !this.state.historyState.isOpen &&
          event.ctrlKey &&
          event.code === 'KeyI' &&
          event.altKey &&
          !event.shiftKey
        ) {
          this.setState(prevState => ({inspect: !prevState.inspect}))
          return
        }

        if (event.ctrlKey && event.code === 'KeyP' && event.altKey && !event.shiftKey) {
          this.handlePublishRequested()
          return
        }

        if (event.ctrlKey && event.code === 'KeyO' && event.altKey && !event.shiftKey) {
          const {draft, published} = this.props
          const item = getProductionPreviewItem(draft || published)
          if (item && item.url) {
            navigateUrl(item.url)
          }
        }
      })
      if (filterFieldFn$) {
        this.filterFieldFnSubscription = filterFieldFn$.subscribe(filterField =>
          this.setState({filterField})
        )
      }
    }

    componentWillUnmount() {
      this.unlistenForKey()
      this.setSavingStatus.cancel()
      if (this.filterFieldFnSubscription) {
        this.filterFieldFnSubscription.unsubscribe()
      }

      if (this.duplicate$) {
        this.duplicate$.unsubscribe()
      }
      if (this._historyEventsSubscription) {
        this._historyEventsSubscription.unsubscribe()
      }
    }

    // @todo move publishing notification out of this component
    UNSAFE_componentWillReceiveProps(nextProps) {
      this.setState(currentState => ({
        didPublish: currentState.didPublish || (this.props.isPublishing && !nextProps.isPublishing)
      }))

      if (this.props.isRestoring && !nextProps.isRestoring) {
        this.setHistoryState(INITIAL_HISTORY_STATE)
      }

      if (this.props.isSaving && !nextProps.isSaving) {
        this.setState({
          showSavingStatus: true
        })
        this.setSavingStatus()
      }
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

    handleFocus = path => {
      this.setState({focusPath: path})
    }

    handleBlur = () => {
      // do nothing
    }

    handleCreateCopy = () => {
      const {router, draft, published, paneIndex} = this.props
      const prevId = getPublishedId((draft || published)._id)
      const omit = ['_createdAt', '_updatedAt']

      const duplicatedDocument = this.isLiveEditEnabled()
        ? copyDocument(published, {omit})
        : newDraftFrom(copyDocument(draft || published, {omit}))

      this.duplicate$ = documentStore.create(duplicatedDocument).subscribe(copied => {
        const copyDocId = getPublishedId(copied._id)
        if (router.state.panes) {
          const newPanes = router.state.panes.map((prev, i) =>
            i === paneIndex - 1 && prev === prevId ? copyDocId : prev
          )
          router.navigate({
            ...router.state,
            panes: newPanes
          })
        } else if (router.state.editDocumentId) {
          router.navigate({
            ...router.state,
            editDocumentId: copyDocId
          })
        } else {
          throw new Error('Unknown router state')
        }
      })
    }

    handleEditAsActualType = () => {
      const {router, draft, published} = this.props
      router.navigateIntent('edit', {
        id: getPublishedId((draft || published)._id),
        type: draft._type || published._type
      })
    }

    handleChange = changeEvent => {
      const {onChange} = this.props
      onChange(changeEvent)
    }

    handleMenuToggle = evt => {
      evt.stopPropagation()
      this.setState(prevState => ({isMenuOpen: !prevState.isMenuOpen}))
    }

    handlePublishRequested = () => {
      const {markers, validationPending, onPublish, draft} = this.props
      if (!draft) {
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

      onPublish(draft)
    }

    handleCancelUnpublish = () => {
      this.setState({showConfirmUnpublish: false})
    }

    handleCancelDelete = () => {
      this.setState({showConfirmDelete: false})
    }

    handleConfirmUnpublish = () => {
      const {onUnpublish} = this.props
      onUnpublish()
      this.setState({showConfirmUnpublish: false})
    }

    handleConfirmDelete = () => {
      const {onDelete} = this.props
      onDelete()
      this.setState({showConfirmDelete: false})
    }

    handleHideInspector = () => {
      this.setState({inspect: false})
    }

    handleMenuAction = item => {
      if (item.action === 'production-preview') {
        navigateUrl(item.url)
      }

      if (item.action === 'delete') {
        this.setState({showConfirmDelete: true})
      }

      if (item.action === 'unpublish') {
        this.setState({showConfirmUnpublish: true})
      }

      if (item.action === 'duplicate') {
        this.handleCreateCopy()
      }

      if (item.action === 'inspect') {
        this.setState({inspect: true})
      }

      if (item.action === 'browseHistory') {
        this.handleOpenHistory()
      }

      this.setState({isMenuOpen: false})
    }

    handleCloseValidationResults = () => {
      this.setState({showValidationTooltip: false})
    }

    handleToggleValidationResults = () => {
      this.setState(prevState => ({showValidationTooltip: !prevState.showValidationTooltip}))
    }

    isLiveEditEnabled() {
      const selectedSchemaType = schema.get(this.props.type.name)
      return selectedSchemaType.liveEdit === true
    }

    getTitle(value) {
      const {title: paneTitle, type} = this.props
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
        <span className={styles.menuItem}>
          {published ? 'Publish changes' : 'Publish'}
          {errors.length < 1 && (
            <span className={styles.hotkey}>
              <Hotkeys keys={['Ctrl', 'Alt', 'P']} />
            </span>
          )}
        </span>
      )
    }

    renderActions = () => {
      const {draft, published, markers, type, isReconnecting} = this.props
      const {historyState, handleFocus, showSavingStatus, showValidationTooltip} = this.state
      if (historyState.isOpen) {
        return null
      }
      return (
        <Actions
          handleFocus={handleFocus}
          value={draft || published}
          markers={markers}
          type={type}
          isLiveEditEnabled={this.isLiveEditEnabled()}
          isReconnecting={isReconnecting}
          showSavingStatus={showSavingStatus}
          showValidationTooltip={showValidationTooltip}
          onCloseValidationResults={this.handleCloseValidationResults}
          onToggleValidationResults={this.handleToggleValidationResults}
          onFocus={this.handleFocus}
        />
      )
    }

    renderPublishInfo = () => {
      const {
        draft,
        isCreatingDraft,
        isPublishing,
        isReconnecting,
        isUnpublishing,
        markers,
        published
      } = this.props
      const validation = markers.filter(marker => marker.type === 'validation')
      const errors = validation.filter(marker => marker.level === 'error')
      return (
        <>
          <Tooltip
            arrow
            theme="light"
            disabled={'ontouchstart' in document.documentElement}
            className={styles.publishButton}
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
          <div className={styles.publishInfoUndoButton}>
            {!published && (
              <Button kind="simple" onClick={() => this.setState({showConfirmDelete: true})}>
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

    renderHistoryInfo = () => {
      const {isReconnecting, isRestoring, onRestore} = this.props
      const {historyState} = this.state
      const selectedEvent = this.findSelectedEvent()

      const isLatestEvent = historyState.events[0] === selectedEvent
      return (
        <>
          {isRestoring && (
            <div className={styles.spinnerContainer}>
              <Spinner center message="Restoring revision…" />
            </div>
          )}
          <RestoreHistoryButton
            disabled={isRestoring || isReconnecting || isLatestEvent}
            onRestore={() =>
              onRestore({id: selectedEvent.displayDocumentId, rev: selectedEvent.rev})
            }
          />
        </>
      )
    }

    setHistoryState = nextHistoryState => {
      this.setState(prevState => ({historyState: {...prevState.historyState, ...nextHistoryState}}))
    }

    handleOpenHistory = () => {
      if (this.state.historyState.isOpen) {
        return
      }
      const {draft, published} = this.props
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

    renderStaticContent = () => {
      const {draft} = this.props
      const {historyState} = this.state

      const spinnerMessage = getSpinnerMessage(this.props)

      return (
        <>
          {spinnerMessage && (
            <div className={styles.spinnerContainer}>
              <Spinner center message={spinnerMessage} />
            </div>
          )}
          <div
            className={
              (draft || historyState.isOpen) && !this.isLiveEditEnabled()
                ? styles.publishInfo
                : styles.publishInfoHidden
            }
          >
            {historyState.isOpen && this.renderHistoryInfo()}
            {!historyState.isOpen && draft && this.renderPublishInfo()}
          </div>
        </>
      )
    }

    handleHistorySelect = event => {
      this.setHistoryState({
        selectedRev: event.rev
      })
    }

    renderForm() {
      const {type, markers, draft, published, patchChannel, initialValue} = this.props
      const {historyState, focusPath, filterField, isReconnecting} = this.state
      const selectedEvent = this.findSelectedEvent()

      return historyState.isOpen && !historyState.isLoading && selectedEvent ? (
        <HistoryForm
          isLatest={selectedEvent === historyState.events[0]}
          event={selectedEvent}
          schema={schema}
          type={type}
        />
      ) : (
        <EditForm
          draft={draft}
          filterField={filterField}
          focusPath={focusPath}
          initialValue={initialValue}
          isLiveEditEnabled={this.isLiveEditEnabled()}
          markers={markers}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          onFocus={this.handleFocus}
          onShowHistory={this.handleOpenHistory}
          patchChannel={patchChannel}
          published={published}
          readOnly={isReconnecting || !isActionEnabled(type, 'update')}
          schema={schema}
          type={type}
        />
      )
    }

    render() {
      const {
        draft,
        published,
        type,
        isLoading,
        isReconnecting,
        transactionResult,
        onClearTransactionResult
      } = this.props

      const {
        inspect,
        showConfirmDelete,
        showConfirmUnpublish,
        didPublish,
        historyState
      } = this.state

      const value = draft || published

      if (isLoading) {
        return (
          <div className={styles.loading}>
            <Spinner center message={`Loading ${type.title}…`} delay={600} />
          </div>
        )
      }

      const hasTypeMismatch = value && value._type && value._type !== type.name
      if (hasTypeMismatch) {
        return (
          <div className={styles.typeMisMatchMessage}>
            This document is of type <code>{value._type}</code> and cannot be edited as{' '}
            <code>{type.name}</code>
            <div>
              <Button onClick={this.handleEditAsActualType}>Edit as {value._type} instead</Button>
            </div>
          </div>
        )
      }

      const enabledActions = resolveEnabledActions(type)
      return (
        <div className={historyState.isOpen ? styles.paneWrapperWithHistory : styles.paneWrapper}>
          {historyState.isOpen && (
            <History
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
          <Pane
            styles={this.props.paneStyles}
            index={this.props.index}
            title={this.getTitle(value)}
            onAction={this.handleMenuAction}
            menuItems={getMenuItems(
              enabledActions,
              draft,
              published,
              this.isLiveEditEnabled(),
              historyState.isOpen,
              historyState.isOpen && this.findSelectedEvent()
            )}
            renderActions={this.renderActions}
            onMenuToggle={this.handleMenuToggle}
            isSelected // last pane is always selected for now
            staticContent={this.renderStaticContent()}
            contentMaxWidth={672}
            minSize={historyState.isOpen && 1000}
          >
            <div className={styles.pane}>
              {this.renderForm()}

              {afterEditorComponents.map((AfterEditorComponent, i) => (
                <AfterEditorComponent key={i} documentId={published._id} />
              ))}

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
                  subtitle={<DocTitle document={draft || published} />}
                />
              )}
              {transactionResult && transactionResult.type === 'error' && (
                <Snackbar
                  kind="error"
                  actionTitle="OK"
                  onAction={onClearTransactionResult}
                  title={transactionResult.message}
                  subtitle={<details>{transactionResult.error.message}</details>}
                />
              )}
            </div>
          </Pane>
        </div>
      )
    }
  }
)
