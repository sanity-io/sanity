/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any, complexity */

import React from 'react'
import {useObservable} from '@sanity/react-hooks'
import client from 'part:@sanity/base/client'
import schema from 'part:@sanity/base/schema'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import TabbedPane from 'part:@sanity/components/panes/tabbed'
import Snackbar from 'part:@sanity/components/snackbar/default'
import LanguageFilter from 'part:@sanity/desk-tool/language-select-component?'
import * as PathUtils from '@sanity/util/paths'
import {usePaneRouter} from '../../contexts/PaneRouterContext'
import {getMenuItems, getProductionPreviewItem} from './menuItems'
import {DocumentActionShortcuts, isInspectHotkey, isPreviewHotkey} from './keyboardShortcuts'
import {Doc, DocumentViewType, MenuAction} from './types'

import DocumentStatusBar from './statusBar/DocumentStatusBar'
import {createObservableController} from './history/controller'
import {Timeline} from './history/timeline'
import InspectView from './inspect/InspectView'
import {ChangesPanel} from './changesPanel/ChangesPanel'
import {HistoryTimelinePanel} from './historyTimelinePanel'
import FormView from './FormView'
import {Validation} from './Validation'
import {DocumentHeaderTitle} from './DocumentHeaderTitle'
import {DocumentOperationResults} from './DocumentOperationResults'
import styles from './DocumentPane.css'

declare const __DEV__: boolean

interface Props {
  title?: string
  paneKey: string
  type: any
  published: null | Doc
  draft: null | Doc
  connectionState: 'connecting' | 'connected' | 'reconnecting'
  isSelected: boolean
  isCollapsed: boolean
  markers: any[]
  onChange: (patches: any[]) => void
  isClosable: boolean
  onExpand?: () => void
  onCollapse?: () => void
  menuItems: MenuAction[]
  menuItemGroups: {id: string}[]
  views: DocumentViewType[]
  initialValue?: Doc
  schemaType: any
  options: {
    id: string
    type: string
    template?: string
  }
  presence: any
}

function getInitialValue(props: Props): Doc {
  const {initialValue = {}, options} = props
  const base = {_type: options.type}

  return initialValue ? {...base, ...initialValue} : base
}

function DocumentPane(props: Props) {
  const {
    isSelected,
    isCollapsed,
    isClosable,
    markers,
    menuItemGroups = [],
    onChange,
    onCollapse,
    connectionState,
    onExpand,
    options,
    paneKey,
    title = '',
    draft,
    published,
    presence,
    schemaType,
    views = []
  } = props

  const documentId = getPublishedId(options.id)
  const typeName = options.type

  // Contexts
  const paneRouter = usePaneRouter()

  const [timeline] = React.useState(
    () =>
      new Timeline({
        publishedId: documentId,
        draft,
        published,
        enableTrace: __DEV__
      })
  )

  const historyController = useObservable(
    createObservableController({
      timeline,
      documentId,
      client
    })
  )! // note: this emits sync so can never be null

  // TODO: Fetch only when open
  React.useEffect(() => {
    historyController.update({
      fetchAtLeast: 5
    })
  })

  // Refs
  const formRef = React.useRef<any | null>(null)
  const documentIdRef = React.useRef<string>(documentId)

  const [showValidationTooltip, setShowValidationTooltip] = React.useState<boolean>(false)

  const initialFocusPath = paneRouter.params.path
    ? PathUtils.fromString(paneRouter.params.path)
    : null

  const initialValue = getInitialValue(props)
  const value = draft || published || initialValue

  const activeViewId = paneRouter.params.view || (views[0] && views[0].id)
  const inspect = paneRouter.params.inspect === 'on'
  const startTimeId = paneRouter.params.startTime
  const startTime = React.useMemo(() => (startTimeId ? timeline.parseTimeId(startTimeId) : null), [
    startTimeId,
    historyController.version
  ])

  const historyDisplayed: 'from' | 'to' =
    paneRouter.params.historyDisplayed === 'from' ? 'from' : 'to'

  if (startTimeId && !startTime) {
    // TODO: The chunk is not available yet
  }

  const isHistoryOpen = Boolean(startTime)

  const menuItems =
    getMenuItems({
      value,
      isHistoryEnabled: true,
      canShowHistoryList: true,
      isHistoryOpen,
      isLiveEditEnabled: schemaType.liveEdit === true,
      rev: startTime ? startTime.chunk.id : null
    }) || []

  // Callbacks

  const toggleInspect = (toggle = !inspect) => {
    const {inspect: oldInspect, ...params} = paneRouter.params
    if (toggle) {
      paneRouter.setParams({inspect: 'on', ...params})
    } else {
      paneRouter.setParams(params)
    }
  }

  const toggleHistory = (newStartTime: string | null = startTime ? null : '-') => {
    const {startTime: oldStartTime, ...params} = paneRouter.params
    if (newStartTime) {
      paneRouter.setParams({startTime: newStartTime, ...params})
    } else {
      paneRouter.setParams(params)
    }
  }

  const toggleHistoryDisplayed = (value: 'from' | 'to') => {
    paneRouter.setParams({...paneRouter.params, historyDisplayed: value})
  }

  const handleKeyUp = (event: any) => {
    if (event.key === 'Escape' && showValidationTooltip) {
      setShowValidationTooltip(false)
    }

    if (isInspectHotkey(event)) {
      toggleInspect()
    }

    if (isPreviewHotkey(event)) {
      // const {draft, published} = props
      const item = getProductionPreviewItem({
        value,
        rev: null
      })

      if (item && item.url) {
        window.open(item.url)
      }
    }
  }

  const handleCloseValidationResults = () => {
    setShowValidationTooltip(false)
  }

  const handleClosePane = () => {
    paneRouter.closeCurrent()
  }

  const handleMenuAction = (item: MenuAction) => {
    if (item.action === 'production-preview') {
      window.open(item.url)
      return true
    }
    if (item.action === 'inspect') {
      toggleInspect(true)
      return true
    }
    if (item.action === 'browseHistory') {
      toggleHistory('-')
      return true
    }
    return false
  }

  const handleSetActiveView = (id: string) => {
    paneRouter.setView(id)
  }

  const handleSetFocus = (path: any) => {
    if (formRef.current) {
      formRef.current.handleFocus(path)
    }
  }

  const handleSplitPane = () => {
    paneRouter.duplicateCurrent()
  }

  const handleToggleValidationResults = () => {
    setShowValidationTooltip(val => !val)
  }

  // Reset document state
  React.useEffect(() => {
    const prevPublishedId = documentIdRef.current
    documentIdRef.current = documentId
    if (documentId !== prevPublishedId) {
      console.log('TODO: reset state')
    }
  }, [documentId])

  if (!documentId) {
    return <div>No document ID</div>
  }

  // TODO: Maybe history state belongs somewhere else since `value` is a props here
  let displayed = value

  if (startTime) {
    timeline.setRange(startTime, null)
    displayed = historyDisplayed === 'from' ? timeline.startAttributes() : timeline.endAttributes()
  }

  const paneHeaderTitle = (
    <DocumentHeaderTitle documentType={typeName} paneTitle={title} value={value} />
  )

  const paneFooter = (
    <DocumentStatusBar
      id={documentId}
      type={typeName}
      lastUpdated={value && value._updatedAt}
      onLastUpdatedButtonClick={() => null}
    />
  )

  const renderPaneHeaderActions = React.useCallback(
    () =>
      isHistoryOpen ? null : (
        <>
          <div className={styles.paneFunctions}>
            {LanguageFilter && <LanguageFilter />}
            <Validation
              id={documentId}
              type={typeName}
              markers={markers}
              showValidationTooltip={showValidationTooltip}
              onCloseValidationResults={handleCloseValidationResults}
              onToggleValidationResults={handleToggleValidationResults}
              onFocus={handleSetFocus}
            />
          </div>
        </>
      ),
    [
      isHistoryOpen,
      documentId,
      markers,
      handleCloseValidationResults,
      handleSetFocus,
      handleToggleValidationResults,
      showValidationTooltip
    ]
  )

  return (
    <DocumentActionShortcuts
      id={options.id}
      type={typeName}
      onKeyUp={handleKeyUp}
      className={styles.root}
    >
      <div className={styles.container}>
        {isHistoryOpen && (
          <div className={styles.historyTimelineContainer}>
            <SelectPublishedButton timeId={timeline.publishedTimeId()} onSelect={toggleHistory} />
            <SelectHistoryDisplayed value={historyDisplayed} onChange={toggleHistoryDisplayed} />
            <HistoryTimelinePanel
              timeline={timeline}
              onSelect={time => toggleHistory(time)}
              displayed={historyDisplayed}
              startTime={startTime}
            />
          </div>
        )}

        <div className={styles.editorContainer} key="editor">
          {inspect && <InspectView value={value} onClose={() => toggleInspect(false)} />}

          <TabbedPane
            key="pane"
            idPrefix={paneKey}
            title={paneHeaderTitle}
            views={views}
            activeView={activeViewId}
            onSetActiveView={handleSetActiveView}
            onSplitPane={handleSplitPane}
            onCloseView={handleClosePane}
            menuItemGroups={menuItemGroups}
            isSelected={isSelected}
            isCollapsed={isCollapsed}
            onCollapse={onCollapse}
            onExpand={onExpand}
            onAction={handleMenuAction}
            menuItems={menuItems}
            footer={paneFooter}
            renderActions={renderPaneHeaderActions}
            isClosable={isClosable}
            hasSiblings={paneRouter.hasGroupSiblings}
          >
            {/* {revision.isLoading && <HistorySpinner selectedHistoryEvent={selectedHistoryEvent} />} */}

            <DocumentView
              activeViewId={activeViewId}
              connectionState={connectionState}
              documentId={documentId}
              documentType={typeName}
              formRef={formRef}
              initialValue={initialValue}
              isHistoryOpen={isHistoryOpen}
              markers={markers}
              presence={presence}
              initialFocusPath={initialFocusPath}
              onChange={onChange}
              value={displayed}
              readOnly={historyDisplayed === 'from'}
              views={views}
            />

            {connectionState === 'reconnecting' && (
              <Snackbar kind="warning" isPersisted title="Connection lost. Reconnecting…" />
            )}

            <DocumentOperationResults id={documentId} type={typeName} />
          </TabbedPane>
        </div>

        {isHistoryOpen && (
          <div className={styles.changesContainer}>
            <ChangesPanel
              diff={timeline.currentDiff() as any}
              schemaType={schemaType}
              documentId={documentId}
            />
          </div>
        )}
      </div>
    </DocumentActionShortcuts>
  )
}

function DocumentView({
  activeViewId,
  connectionState,
  documentId,
  documentType,
  formRef,
  initialValue,
  isHistoryOpen,
  markers,
  presence,
  initialFocusPath,
  onChange,
  value,
  readOnly,
  views
}: {
  activeViewId: string
  connectionState: string
  documentId: string
  documentType: string
  formRef: React.RefObject<any>
  initialValue: Doc
  isHistoryOpen: boolean
  markers: any
  presence: any
  initialFocusPath: unknown[] | null
  onChange: (patches: any[]) => void
  value: Doc | null
  readOnly?: boolean
  views: {
    type: string
    id: string
    title: string
    options: {}
    component: React.ComponentType<any>
  }[]
}) {
  const schemaType = schema.get(documentType)
  const activeView = views.find(view => view.id === activeViewId) || views[0] || {type: 'form'}

  const viewProps = {
    // Other stuff
    documentId,
    options: activeView.options,
    schemaType
  }

  const formProps = {
    ...viewProps,
    value: value,
    connectionState,
    initialValue,
    isHistoryOpen,
    markers,
    initialFocusPath,
    presence,
    onChange,
    readOnly
  }

  switch (activeView.type) {
    case 'form':
      return <FormView {...formProps} id={documentId} ref={formRef} />
    case 'component':
      return <activeView.component {...viewProps} />
    default:
      return null
  }
}

function SelectHistoryDisplayed({
  value,
  onChange
}: {
  value: 'from' | 'to'
  onChange: (newValue: 'from' | 'to') => void
}) {
  return (
    <div>
      <div>
        <label>
          Newest{' '}
          <input
            type="radio"
            checked={value === 'to'}
            onChange={evt => onChange(evt.target.checked ? 'to' : 'from')}
          />
        </label>
      </div>

      <div>
        <label>
          Oldest{' '}
          <input
            type="radio"
            checked={value === 'from'}
            onChange={evt => onChange(evt.target.checked ? 'from' : 'to')}
          />
        </label>
      </div>
    </div>
  )
}

function SelectPublishedButton({
  timeId,
  onSelect
}: {
  timeId: string | null
  onSelect: (timeId: string) => void
}) {
  return (
    <button
      type="button"
      disabled={timeId === null}
      onClick={() => {
        if (timeId) onSelect(timeId)
      }}
    >
      Compare against latest published
    </button>
  )
}

export default DocumentPane
