import {AddIcon} from '@sanity/icons/Add'
import {CloseIcon} from '@sanity/icons/Close'
import {Badge, Button, TextInput} from '@sanity/ui'
import {Reorder, useDragControls} from 'motion/react'
import {
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
  useCallback,
  useRef,
  useState,
} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type VistaTab} from '../../store/types'
import {useVistaActor, useVistaSelector} from '../../store/VistaActorContext'
import {deriveTabTitle} from '../../util/tabTitle'
import {
  tab as tabStyle,
  tabBar,
  tabCloseButton,
  tabItem,
  tabList,
  tabTitleButton,
  tabTitleInput,
} from '../vista.css'

/** The element id of the active tab's content, referenced by every tab's `aria-controls` */
export const QUERY_TAB_PANEL_ID = 'vista-query-tabpanel'

export function getQueryTabId(tabId: string): string {
  return `vista-query-tab-${tabId}`
}

function getTabTitle(tab: VistaTab, fallback: string): string {
  return tab.title || deriveTabTitle(tab.query) || fallback
}

interface TabTitleInputProps {
  title: string
  onCommit: (title: string) => void
  onCancel: () => void
}

/** Mounted only while renaming, so the draft always starts from the current title */
function TabTitleInput({title, onCommit, onCancel}: TabTitleInputProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const [draft, setDraft] = useState(title)

  return (
    <Box className={tabTitleInput} paddingY={1}>
      <TextInput
        autoFocus
        data-testid="vista-tab-title-input"
        fontSize={1}
        onBlur={() => onCommit(draft)}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter') onCommit(draft)
          if (event.key === 'Escape') onCancel()
        }}
        padding={2}
        placeholder={t('vista.tabs.title-placeholder')}
        value={draft}
      />
    </Box>
  )
}

interface TabHandleProps {
  tab: VistaTab
  selected: boolean
  editing: boolean
  /** The list the tab may be dragged within */
  listRef: RefObject<HTMLDivElement | null>
  onSelect: () => void
  onClose: () => void
  onStartRename: () => void
  onRename: (title: string) => void
  onCancelRename: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

/**
 * One reorderable tab. Only the title starts a drag, so the close button and the rename field
 * keep their own pointer behaviour.
 */
function TabHandle(props: TabHandleProps) {
  const {
    tab,
    selected,
    editing,
    listRef,
    onSelect,
    onClose,
    onStartRename,
    onRename,
    onCancelRename,
    onKeyDown,
  } = props
  const {t} = useTranslation(visionLocaleNamespace)
  const title = getTabTitle(tab, t('vista.tabs.untitled'))
  const dragControls = useDragControls()
  const [dragging, setDragging] = useState(false)

  const handleAuxClick = useCallback(
    (event: MouseEvent) => {
      // Middle click closes the tab, as browsers do
      if (event.button === 1) {
        event.preventDefault()
        onClose()
      }
    },
    [onClose],
  )

  const startDrag = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      // Clicks still land: motion only turns this into a drag once the pointer moves
      if (event.button === 0) dragControls.start(event)
    },
    [dragControls],
  )

  return (
    <Reorder.Item
      as="div"
      className={tabItem}
      data-dragging={dragging ? 'true' : undefined}
      data-testid="vista-tab-item"
      // Keep the dragged tab inside the strip, which clips whatever leaves it
      dragConstraints={listRef}
      dragControls={dragControls}
      dragElastic={0.1}
      dragListener={false}
      layout="position"
      onDragEnd={() => setDragging(false)}
      onDragStart={() => setDragging(true)}
      value={tab}
    >
      <Flex
        alignItems="center"
        className={tabStyle}
        data-selected={selected ? 'true' : undefined}
        data-testid="vista-tab"
        gap={1}
        paddingLeft={1}
        paddingRight={1}
        role="presentation"
      >
        {editing ? (
          <TabTitleInput onCancel={onCancelRename} onCommit={onRename} title={title} />
        ) : (
          <Button
            aria-controls={QUERY_TAB_PANEL_ID}
            aria-selected={selected}
            className={tabTitleButton}
            data-testid="vista-tab-button"
            fontSize={1}
            id={getQueryTabId(tab.id)}
            mode="bleed"
            onAuxClick={handleAuxClick}
            onClick={onSelect}
            onDoubleClick={onStartRename}
            onKeyDown={onKeyDown}
            onPointerDown={startDrag}
            padding={2}
            role="tab"
            tabIndex={selected ? 0 : -1}
            text={title}
            textWeight={selected ? 'medium' : 'regular'}
          />
        )}
        {tab.autoRefetch && (
          <Box flexShrink={0}>
            <Badge fontSize={0} tone="positive">
              {t('vista.live.active')}
            </Badge>
          </Box>
        )}
        <Button
          aria-label={t('vista.tabs.close-tab')}
          className={tabCloseButton}
          data-testid="vista-tab-close"
          fontSize={1}
          icon={CloseIcon}
          mode="bleed"
          onClick={onClose}
          padding={1}
          tabIndex={-1}
        />
      </Flex>
    </Reorder.Item>
  )
}

export function QueryTabBar() {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVistaActor()
  const tabs = useVistaSelector((snapshot) => snapshot.context.tabs)
  const activeTabId = useVistaSelector((snapshot) => snapshot.context.activeTabId)
  const [editingId, setEditingId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const focusTab = useCallback((id: string) => {
    listRef.current?.querySelector<HTMLElement>(`#${getQueryTabId(id)}`)?.focus()
  }, [])

  const reorder = useCallback(
    (ordered: VistaTab[]) =>
      actorRef.send({type: 'tab.reorder', ids: ordered.map((tab) => tab.id)}),
    [actorRef],
  )

  // The ARIA tabs keyboard pattern: arrows, Home and End move between tabs and activate them,
  // Delete closes the focused tab (the close button itself stays out of the tab order). Shift
  // with an arrow moves the tab instead, the keyboard counterpart of dragging it.
  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (tabs.length === 0) return
      if (event.key === 'Delete') {
        event.preventDefault()
        actorRef.send({type: 'tab.close', id: activeTabId})
        // The tab that takes over may be brand new (closing the last tab), so it only exists
        // after React has rendered the new snapshot
        const nextId = actorRef.getSnapshot().context.activeTabId
        requestAnimationFrame(() => focusTab(nextId))
        return
      }
      const index = tabs.findIndex((tab) => tab.id === activeTabId)
      const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
      if (event.shiftKey && direction !== 0) {
        const target = index + direction
        if (target < 0 || target >= tabs.length) return
        event.preventDefault()
        const ordered = tabs.slice()
        ;[ordered[index], ordered[target]] = [ordered[target], ordered[index]]
        reorder(ordered)
        return
      }
      let nextIndex: number | undefined
      if (direction !== 0) nextIndex = (index + direction + tabs.length) % tabs.length
      if (event.key === 'Home') nextIndex = 0
      if (event.key === 'End') nextIndex = tabs.length - 1
      if (nextIndex === undefined) return
      event.preventDefault()
      const next = tabs[nextIndex]
      actorRef.send({type: 'tab.select', id: next.id})
      focusTab(next.id)
    },
    [activeTabId, actorRef, focusTab, reorder, tabs],
  )

  return (
    <Flex
      alignItems="stretch"
      className={tabBar}
      data-testid="vista-tab-bar"
      flexShrink={0}
      paddingX={1}
    >
      <Reorder.Group
        aria-label={t('vista.tabs.label')}
        as="div"
        axis="x"
        className={tabList}
        onReorder={reorder}
        ref={listRef}
        role="tablist"
        values={tabs}
      >
        {tabs.map((tab) => (
          <TabHandle
            editing={editingId === tab.id}
            key={tab.id}
            listRef={listRef}
            onKeyDown={handleTabKeyDown}
            onCancelRename={() => setEditingId(null)}
            onClose={() => actorRef.send({type: 'tab.close', id: tab.id})}
            onRename={(title) => {
              setEditingId(null)
              actorRef.send({type: 'tab.rename', id: tab.id, title})
            }}
            onSelect={() => actorRef.send({type: 'tab.select', id: tab.id})}
            onStartRename={() => setEditingId(tab.id)}
            selected={tab.id === activeTabId}
            tab={tab}
          />
        ))}
      </Reorder.Group>
      <Flex alignItems="center" paddingX={1}>
        <Button
          aria-label={t('vista.tabs.new-tab')}
          data-testid="vista-new-tab"
          fontSize={1}
          icon={AddIcon}
          mode="bleed"
          onClick={() => actorRef.send({type: 'tab.add'})}
          padding={2}
        />
      </Flex>
    </Flex>
  )
}
