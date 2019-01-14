/* eslint-disable complexity */
import PropTypes from 'prop-types'
// Connects the FormBuilder with various sanity roles
import React from 'react'
import {debounce} from 'lodash'
import {Tooltip} from 'react-tippy'
import {withRouterHOC} from 'part:@sanity/base/router'
import {PreviewFields} from 'part:@sanity/base/preview'
import {getPublishedId, newDraftFrom} from 'part:@sanity/base/util/draft-utils'
import {resolveEnabledActions, isActionEnabled} from 'part:@sanity/base/util/document-action-utils'
import Spinner from 'part:@sanity/components/loading/spinner'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import PopOverDialog from 'part:@sanity/components/dialogs/popover'
import FormBuilder from 'part:@sanity/form-builder'
import TrashIcon from 'part:@sanity/base/trash-icon'
import UndoIcon from 'part:@sanity/base/undo-icon'
import PublicIcon from 'part:@sanity/base/public-icon'
import VisibilityOffIcon from 'part:@sanity/base/visibility-off-icon'
import BinaryIcon from 'part:@sanity/base/binary-icon'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'
import documentStore from 'part:@sanity/base/datastore/document'
import schema from 'part:@sanity/base/schema'
import Pane from 'part:@sanity/components/panes/default'
import afterEditorComponents from 'all:part:@sanity/desk-tool/after-editor-component'
import SyncIcon from 'part:@sanity/base/sync-icon'
import CheckIcon from 'part:@sanity/base/check-icon'
import CheckCircleIcon from 'part:@sanity/base/circle-check-icon'
import Snackbar from 'part:@sanity/components/snackbar/default'
import resolveProductionPreviewUrl from 'part:@sanity/transitional/production-preview/resolve-production-url?'
import ValidationList from 'part:@sanity/components/validation/list'
import ChevronDown from 'part:@sanity/base/chevron-down-icon'
import WarningIcon from 'part:@sanity/base/warning-icon'
import LanguageFilter from 'part:@sanity/desk-tool/language-select-component?'
import filterFieldFn$ from 'part:@sanity/desk-tool/filter-fields-fn?'
import Hotkeys from 'part:@sanity/components/typography/hotkeys'
import copyDocument from '../utils/copyDocument'
import ConfirmUnpublish from '../components/ConfirmUnpublish'
// import ConfirmDiscard from '../components/ConfirmDiscard'
import ConfirmDelete from '../components/ConfirmDelete'
import InspectView from '../components/InspectView'
import DocTitle from '../components/DocTitle'
import TimeAgo from '../components/TimeAgo'
import styles from './styles/Editor.css'

function navigateUrl(url) {
  window.open(url)
}

const preventDefault = ev => ev.preventDefault()

// Want a nicer api for listen/unlisten
function listen(target, eventType, callback, useCapture = false) {
  target.addEventListener(eventType, callback, useCapture)
  return function unlisten() {
    target.removeEventListener(eventType, callback, useCapture)
  }
}

const getDuplicateItem = (draft, published) => ({
  action: 'duplicate',
  title: 'Duplicate',
  icon: ContentCopyIcon,
  isDisabled: !draft && !published
})

const getDiscardItem = (draft, published, isLiveEditEnabled) =>
  isLiveEditEnabled
    ? null
    : {
        action: 'discard',
        title: 'Discard changes…',
        icon: UndoIcon,
        isDisabled: !draft || !published
      }

const getUnpublishItem = (draft, published, isLiveEditEnabled) =>
  isLiveEditEnabled
    ? null
    : {
        action: 'unpublish',
        title: 'Unpublish…',
        icon: VisibilityOffIcon,
        isDisabled: !published
      }

const getDeleteItem = (draft, published) => ({
  group: 'danger',
  action: 'delete',
  title: 'Delete…',
  icon: TrashIcon,
  danger: true,
  isDisabled: !draft && !published
})

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

const getProductionPreviewItem = (draft, published) => {
  const snapshot = draft || published
  if (!snapshot || !resolveProductionPreviewUrl) {
    return null
  }
  let previewUrl
  try {
    previewUrl = resolveProductionPreviewUrl(snapshot)
  } catch (error) {
    error.message = `An error was thrown while trying to get production preview url: ${
      error.message
    }`
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

const getMenuItems = (enabledActions, draft, published, isLiveEditEnabled) =>
  [
    getProductionPreviewItem,
    enabledActions.includes('delete') && getDiscardItem,
    enabledActions.includes('delete') && getUnpublishItem,
    enabledActions.includes('create') && getDuplicateItem,
    getInspectItem,
    enabledActions.includes('delete') && getDeleteItem
  ]
    .filter(Boolean)
    .map(fn => fn(draft, published, isLiveEditEnabled))
    .filter(Boolean)

const isValidationError = marker => marker.type === 'validation' && marker.level === 'error'

const INITIAL_STATE = {
  inspect: false,
  isMenuOpen: false,
  isCreatingDraft: false,
  showSavingStatus: false,
  showConfirmDiscard: false,
  showConfirmDelete: false,
  showConfirmUnpublish: false,
  showValidationTooltip: false,
  focusPath: [],
  filterField: () => true
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
      type: PropTypes.object.isRequired,
      markers: PropTypes.arrayOf(
        PropTypes.shape({
          path: PropTypes.array
        })
      ),
      router: PropTypes.shape({
        state: PropTypes.object
      }).isRequired,

      onDelete: PropTypes.func,
      onCreate: PropTypes.func,
      onChange: PropTypes.func,
      onDiscardDraft: PropTypes.func,
      onPublish: PropTypes.func,
      onUnpublish: PropTypes.func,
      transactionResult: PropTypes.shape({type: PropTypes.string}),
      onClearTransactionResult: PropTypes.func,

      validationPending: PropTypes.bool,
      isCreatingDraft: PropTypes.bool,
      isUnpublishing: PropTypes.bool,
      isPublishing: PropTypes.bool,
      isReconnecting: PropTypes.bool,
      isLoading: PropTypes.bool,
      isSaving: PropTypes.bool,
      deletedSnapshot: PropTypes.object
    }

    static defaultProps = {
      title: null,
      markers: [],
      isLoading: false,
      isSaving: false,
      isUnpublishing: false,
      isPublishing: false,
      isReconnecting: false,
      isCreatingDraft: false,
      deletedSnapshot: null,
      transactionResult: null,
      onDelete() {},
      onCreate() {},
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

        if (event.ctrlKey && event.code === 'KeyI' && event.altKey && !event.shiftKey) {
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
    }

    // @todo move publishing notification out of this component
    componentWillReceiveProps(nextProps) {
      this.setState({didPublish: this.props.isPublishing && !nextProps.isPublishing})

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

      const duplicatedDocument = this.isLiveEditEnabled()
        ? copyDocument(published)
        : newDraftFrom(copyDocument(draft || published))

      this.duplicate$ = documentStore.create(duplicatedDocument).subscribe(copied => {
        const copyDocId = getPublishedId(copied._id)
        const newPanes = router.state.panes.map((prev, i) =>
          i === paneIndex - 1 && prev === prevId ? copyDocId : prev
        )
        router.navigate({
          ...router.state,
          panes: newPanes
        })
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

    handleRestore = () => {
      const {deletedSnapshot} = this.props
      this.props.onCreate(deletedSnapshot)
    }

    handleMenuToggle = evt => {
      evt.stopPropagation()
      this.setState(prevState => ({isMenuOpen: !prevState.isMenuOpen}))
    }

    handleMenuClose = evt => {
      this.setState({isMenuOpen: false})
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

    handleCancelDiscard = () => {
      this.setState({showConfirmDiscard: false})
    }

    handleConfirmUnpublish = () => {
      const {onUnpublish} = this.props
      onUnpublish()
      this.setState({showConfirmUnpublish: false})
    }

    handleConfirmDiscard = () => {
      const {onDiscardDraft, draft} = this.props
      onDiscardDraft(draft)
      this.setState({showConfirmDiscard: false})
    }

    handleConfirmDelete = () => {
      const {onDelete, onDiscardDraft, published} = this.props
      if (published) {
        onDelete()
      } else {
        onDiscardDraft()
      }
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

      if (item.action === 'discard') {
        this.setState({showConfirmDiscard: true})
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
      if (paneTitle) {
        return <span>{paneTitle}</span>
      }
      if (!value) {
        return `Creating new ${type.title || type.name}`
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

    renderActions = (props, state) => {
      const {draft, published, markers, type, isReconnecting} = this.props
      const {showSavingStatus, showValidationTooltip} = this.state

      const value = draft || published

      const validation = markers.filter(marker => marker.type === 'validation')
      const errors = validation.filter(marker => marker.level === 'error')
      const warnings = validation.filter(marker => marker.level === 'warning')

      return (
        <div className={styles.paneFunctions}>
          {LanguageFilter && <LanguageFilter />}
          {showSavingStatus && (
            <Tooltip
              className={styles.syncStatusSyncing}
              arrow
              theme="light"
              size="small"
              distance="0"
              title="Syncing your content with the Sanity cloud"
            >
              <span className={styles.syncSpinnerContainer}>
                <span className={styles.syncSpinner}>
                  <SyncIcon />
                </span>
                &nbsp;Syncing…
              </span>
            </Tooltip>
          )}
          {isReconnecting && (
            <Tooltip
              className={styles.syncStatusReconnecting}
              arrow
              theme="light"
              size="small"
              distance="0"
              title="Connection lost. Reconnecting…"
            >
              <span className={styles.syncSpinnerContainer}>
                <span className={styles.syncSpinner}>
                  <SyncIcon />
                </span>
                &nbsp;Reconnecting…
              </span>
            </Tooltip>
          )}
          {value &&
            !showSavingStatus &&
            !isReconnecting && (
              <Tooltip
                className={styles.syncStatusSynced}
                arrow
                theme="light"
                size="small"
                distance="0"
                title="Synced with the Sanity cloud"
              >
                <CheckIcon /> Synced {this.isLiveEditEnabled() && ' (live)'}
              </Tooltip>
            )}
          {(errors.length > 0 || warnings.length > 0) && (
            <Tooltip
              arrow
              theme="light noPadding"
              trigger="click"
              position="bottom"
              interactive
              duration={100}
              open={showValidationTooltip}
              onRequestClose={this.handleCloseValidationResults}
              html={
                <ValidationList
                  truncate
                  markers={validation}
                  showLink
                  isOpen={showValidationTooltip}
                  documentType={type}
                  onClose={this.handleCloseValidationResults}
                  onFocus={this.handleFocus}
                />
              }
            >
              <Button
                color="danger"
                bleed
                icon={WarningIcon}
                padding="small"
                onClick={this.handleToggleValidationResults}
              >
                {errors.length}
                <span style={{paddingLeft: '0.5em', display: 'flex'}}>
                  <ChevronDown />
                </span>
              </Button>
            </Tooltip>
          )}
        </div>
      )
    }

    renderPublishInfo = () => {
      const {draft, markers, published, isReconnecting} = this.props
      const validation = markers.filter(marker => marker.type === 'validation')
      const errors = validation.filter(marker => marker.level === 'error')
      return (
        <div
          className={
            draft && !this.isLiveEditEnabled() ? styles.publishInfo : styles.publishInfoHidden
          }
        >
          <Tooltip
            arrow
            theme="light"
            disabled={'ontouchstart' in document.documentElement}
            className={styles.publishButton}
            //title={errors.length > 0 ? 'Fix errors before publishing' : 'Publish (Ctrl+Alt+P)'}
            html={this.renderPublishButtonTooltip(errors, published)}
          >
            <Button
              disabled={isReconnecting || !draft || errors.length > 0}
              onClick={this.handlePublishRequested}
              color="primary"
            >
              Publish
            </Button>
          </Tooltip>
          <div className={styles.publishInfoUndoButton}>
            {published && (
              <Button kind="simple" onClick={() => this.setState({showConfirmDiscard: true})}>
                Discard changes
              </Button>
            )}
            {this.state.showConfirmDiscard && (
              <PopOverDialog
                onClickOutside={this.handleCancelDiscard}
                useOverlay={false}
                hasAnimation
              >
                <div>
                  <div className={styles.popOverText}>
                    <strong>Are you sure</strong> you want to discard all changes since last published?
                  </div>
                  <ButtonGrid>
                    <Button kind="simple" onClick={this.handleCancelDiscard}>
                      Cancel
                    </Button>
                    <Button color="danger" onClick={this.handleConfirmDiscard}>
                      Discard
                    </Button>
                  </ButtonGrid>
                </div>
              </PopOverDialog>
            )}
            {!published && (
              <Button kind="simple" onClick={() => this.setState({showConfirmDelete: true})}>
                Delete document
              </Button>
            )}
          </div>
        </div>
      )
    }

    render() {
      const {
        draft,
        markers,
        published,
        type,
        isLoading,
        isPublishing,
        isUnpublishing,
        isCreatingDraft,
        isReconnecting,
        patchChannel,
        transactionResult,
        onClearTransactionResult
      } = this.props

      const {
        inspect,
        focusPath,
        showConfirmDelete,
        showConfirmUnpublish,
        didPublish,
        filterField
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
        <Pane
          styles={this.props.paneStyles}
          index={this.props.index}
          title={this.getTitle(value)}
          onAction={this.handleMenuAction}
          menuItems={getMenuItems(enabledActions, draft, published, this.isLiveEditEnabled())}
          renderActions={this.renderActions}
          onMenuToggle={this.handleMenuToggle}
          isSelected // last pane is always selected for now
          staticContent={this.renderPublishInfo()}
          contentMaxWidth={672}
        >
          <div className={styles.root}>
            {(isCreatingDraft || isPublishing || isUnpublishing) && (
              <div className={styles.spinnerContainer}>
                {isCreatingDraft && <Spinner center message="Making changes…" />}
                {isPublishing && <Spinner center message="Publishing…" />}
                {isUnpublishing && <Spinner center message="Unpublishing…" />}
              </div>
            )}
            <div className={styles.top}>
              {!this.isLiveEditEnabled() && (
                <>
                  {published ? (
                    <strong>
                      Published <TimeAgo time={published._updatedAt} />
                    </strong>
                  ) : (
                    <strong>Not published</strong>
                  )}
                </>
              )}
              {value && (
                <>
                  {!this.isLiveEditEnabled() && <span> · </span>}
                  <span>
                    Edited <TimeAgo time={value._updatedAt} />
                  </span>
                </>
              )}
            </div>
            <form
              className={styles.editor}
              onSubmit={preventDefault}
              id="Sanity_Default_DeskTool_Editor_ScrollContainer"
            >
              <FormBuilder
                schema={schema}
                patchChannel={patchChannel}
                value={draft || published || {_type: type.name}}
                type={type}
                filterField={filterField}
                readOnly={isReconnecting || !isActionEnabled(type, 'update')}
                onBlur={this.handleBlur}
                onFocus={this.handleFocus}
                focusPath={focusPath}
                onChange={this.handleChange}
                markers={markers}
              />
            </form>
            {afterEditorComponents.map((AfterEditorComponent, i) => (
              <AfterEditorComponent key={i} documentId={published._id} />
            ))}

            {inspect && <InspectView value={value} onClose={this.handleHideInspector} />}
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
              <Snackbar kind="warning">
                <WarningIcon /> Connection lost. Reconnecting…
              </Snackbar>
            )}
            {didPublish && (
              <Snackbar kind="success" timeout={4}>
                <CheckCircleIcon /> You just published{' '}
                <em>
                  <DocTitle document={draft || published} />
                </em>
              </Snackbar>
            )}
            {transactionResult &&
              transactionResult.type === 'error' && (
                <Snackbar
                  kind="danger"
                  action={{title: 'Ok, got it'}}
                  onAction={onClearTransactionResult}
                >
                  <div>
                    {transactionResult.message}
                    <details>{transactionResult.error.message}</details>
                  </div>
                </Snackbar>
              )}
          </div>
        </Pane>
      )
    }
  }
)
