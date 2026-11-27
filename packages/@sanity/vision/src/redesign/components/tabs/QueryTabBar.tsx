import {AddIcon} from '@sanity/icons/Add'
import {CloseIcon} from '@sanity/icons/Close'
import {UsersIcon} from '@sanity/icons/Users'
import {Button, Text, TextInput} from '@sanity/ui'
import {type Transition, Reorder, useDragControls, useReducedMotion} from 'motion/react'
import {
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Box, Flex} from 'ui5'

import {useVisionTelemetry} from '../../../__telemetry__/useVisionTelemetry'
import {visionLocaleNamespace} from '../../../i18n'
import {useOverlayScrollThumb} from '../../hooks/useOverlayScrollThumb'
import {useVisionTabShortcuts} from '../../hooks/useVisionTabShortcuts'
import {type VisionTab} from '../../store/types'
import {
  usePendingEdits,
  useSavedQueriesApi,
  useVisionActor,
  useVisionSelector,
} from '../../store/VisionActorContext'
import {findSharedQuery} from '../../util/savedQueryTab'
import {VISION_TAB_SHORTCUTS} from '../../util/shortcuts'
import {deriveTabTitle} from '../../util/tabTitle'
import * as styles from '../redesign.module.css'
import {VisionTooltip} from '../VisionTooltip'

/** The element id of the active tab's content, referenced by every tab's `aria-controls` */
export const QUERY_TAB_PANEL_ID = 'vision-query-tabpanel'

export function getQueryTabId(tabId: string): string {
  return `vision-query-tab-${tabId}`
}

/**
 * How the other tabs slide when one is dragged past them, added or closed: an ease-in-out for
 * movement that stays on screen, short enough not to hold up the next click
 */
const LAYOUT_TRANSITION: Transition = {layout: {duration: 0.2, ease: [0.77, 0, 0.175, 1]}}
/** Keyboard reorders and closes, and reduced motion, settle at once */
const INSTANT_LAYOUT_TRANSITION: Transition = {layout: {duration: 0}}

const NO_IDS: ReadonlySet<string> = new Set()

/** Fields and overlays the query editor does not take the focus from when the tool opens */
const KEEPS_FOCUS =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="dialog"], [role="menu"], [role="listbox"]'
/** How many frames the query editor of a tab shown for the first time has to appear in */
const EDITOR_FOCUS_FRAMES = 10

function getTabTitle(tab: VisionTab, fallback: string): string {
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
  // Enter and Escape unmount the field while it has focus, and Chromium then fires `blur` on
  // it; that blur must not commit a draft that was just committed or, worse, just discarded
  const settledRef = useRef(false)

  const commit = () => {
    if (settledRef.current) return
    settledRef.current = true
    onCommit(draft)
  }
  const cancel = () => {
    if (settledRef.current) return
    settledRef.current = true
    onCancel()
  }

  return (
    <Box className={styles.tabTitleInput} paddingX={1}>
      <TextInput
        autoFocus
        data-testid="vision-tab-title-input"
        fontSize={1}
        onBlur={commit}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter') commit()
          if (event.key === 'Escape') cancel()
        }}
        padding={2}
        placeholder={t('vision.tabs.title-placeholder')}
        value={draft}
      />
    </Box>
  )
}

interface TabHandleProps {
  tab: VisionTab
  selected: boolean
  /** The tab is shared as a shared query the current user shared (`VisionTab.sharedId`) */
  shared: boolean
  editing: boolean
  /** Added by a click since the strip mounted, so it fades in rather than popping into place */
  entering: boolean
  layoutTransition: Transition
  /** The list the tab may be dragged within */
  listRef: RefObject<HTMLDivElement | null>
  onSelect: (event: MouseEvent<HTMLButtonElement>) => void
  onClose: () => void
  onStartRename: () => void
  /** `changed` is false when the title was committed as it was shown */
  onRename: (title: string, changed: boolean) => void
  onCancelRename: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
  onDragEnd: () => void
}

/**
 * One reorderable tab. Only the title starts a drag, so the close button and the rename field
 * keep their own pointer behaviour.
 */
function TabHandle(props: TabHandleProps) {
  const {
    tab,
    selected,
    shared,
    editing,
    entering,
    layoutTransition,
    listRef,
    onSelect,
    onClose,
    onStartRename,
    onRename,
    onCancelRename,
    onKeyDown,
    onDragEnd,
  } = props
  const {t} = useTranslation(visionLocaleNamespace)
  const title = getTabTitle(tab, t('vision.tabs.untitled'))
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
      className={styles.tabItem}
      data-dragging={dragging ? 'true' : undefined}
      data-testid="vision-tab-item"
      // Keep the dragged tab inside the strip, which clips whatever leaves it
      dragConstraints={listRef}
      dragControls={dragControls}
      dragElastic={0.1}
      dragListener={false}
      layout="position"
      onDragEnd={() => {
        setDragging(false)
        onDragEnd()
      }}
      onDragStart={() => setDragging(true)}
      transition={layoutTransition}
      value={tab}
    >
      <Flex
        alignItems="center"
        className={styles.tab}
        // On the inner element: motion owns the item's transform
        data-entering={entering ? 'true' : undefined}
        data-selected={selected ? 'true' : undefined}
        data-testid="vision-tab"
        role="presentation"
      >
        {editing ? (
          <TabTitleInput
            onCancel={onCancelRename}
            onCommit={(next) => onRename(next, next !== title)}
            title={title}
          />
        ) : (
          // A plain button, so the whole tab is its hit area and the tab paints hover and focus
          <button
            aria-controls={QUERY_TAB_PANEL_ID}
            aria-selected={selected}
            className={styles.tabTitleButton}
            data-testid="vision-tab-button"
            id={getQueryTabId(tab.id)}
            onAuxClick={handleAuxClick}
            onClick={onSelect}
            onDoubleClick={onStartRename}
            onKeyDown={onKeyDown}
            onPointerDown={startDrag}
            role="tab"
            tabIndex={selected ? 0 : -1}
            type="button"
          >
            {shared && (
              <Text className={styles.tabSharedIcon} muted size={1}>
                <UsersIcon aria-label={t('vision.tabs.shared')} role="img" />
              </Text>
            )}
            <Text className={styles.tabTitle} muted={!selected} size={1} textOverflow="ellipsis">
              {title}
            </Text>
          </button>
        )}
        <Button
          aria-label={t('vision.tabs.close-tab')}
          className={styles.tabCloseButton}
          data-testid="vision-tab-close"
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

export interface QueryTabBarProps {
  /** The tool's root: the tab shortcuts work wherever the focus is inside it */
  rootElement: HTMLElement | null
}

export function QueryTabBar({rootElement}: QueryTabBarProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVisionActor()
  const pendingEdits = usePendingEdits()
  const telemetry = useVisionTelemetry()
  const tabs = useVisionSelector((snapshot) => snapshot.context.tabs)
  const activeTabId = useVisionSelector((snapshot) => snapshot.context.activeTabId)
  const {queries} = useSavedQueriesApi()
  const [editingId, setEditingId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const newTabSlotRef = useRef<HTMLDivElement | null>(null)
  const scrollThumbRef = useRef<HTMLDivElement | null>(null)
  const reducedMotion = useReducedMotion()
  // Whether the last change to the strip came from the keyboard. Shift+Arrow, Delete and the tab
  // shortcuts repeat fast, and a slide on every press makes the strip feel slower than the keys
  const [keyboardDriven, setKeyboardDriven] = useState(false)
  const layoutTransition =
    keyboardDriven || reducedMotion ? INSTANT_LAYOUT_TRANSITION : LAYOUT_TRANSITION

  // Tabs present when the strip mounts (a reload, a remount) are already in place; only tabs
  // added afterwards by the pointer animate in
  const [knownIds, setKnownIds] = useState(() => tabs.map((tab) => tab.id))
  const [enteringIds, setEnteringIds] = useState(NO_IDS)
  if (knownIds.length !== tabs.length || knownIds.some((id, i) => id !== tabs[i].id)) {
    const known = new Set(knownIds)
    setKnownIds(tabs.map((tab) => tab.id))
    setEnteringIds(
      keyboardDriven
        ? NO_IDS
        : new Set(tabs.filter((tab) => !known.has(tab.id)).map((tab) => tab.id)),
    )
  }

  const focusTab = useCallback((id: string) => {
    listRef.current?.querySelector<HTMLElement>(`#${getQueryTabId(id)}`)?.focus()
  }, [])
  const findQueryEditor = useCallback(
    (id: string) =>
      rootElement?.querySelector<HTMLElement>(
        `[aria-labelledby="${getQueryTabId(id)}"] [data-testid="vision-query-editor"] .cm-content`,
      ) ?? null,
    [rootElement],
  )

  // Opening the tool, clicking a tab and adding one with the new tab button put the focus in the
  // shown tab's query editor, so typing goes straight into the query. The editor only takes it
  // while nothing else has: `from`, the element focused when it was asked for, still has it, or
  // the focus fell back to the page as a clicked element was hidden. A rename field or a menu
  // that opened in the meantime keeps it. The editor of a tab shown for the first time is created
  // in an effect, so it may take a few frames to be there. Returns a function that stops trying.
  const focusShownEditor = useCallback(
    (from: Element | null) => {
      const id = actorRef.getSnapshot().context.activeTabId
      let frames = EDITOR_FOCUS_FRAMES
      let request = 0
      const attempt = () => {
        const active = document.activeElement
        if (active !== from && active !== document.body && active !== null) return
        const editor = findQueryEditor(id)
        editor?.focus({preventScroll: true})
        if (editor?.contains(document.activeElement)) return
        frames--
        if (frames > 0) request = requestAnimationFrame(attempt)
      }
      request = requestAnimationFrame(attempt)
      return () => cancelAnimationFrame(request)
    },
    [actorRef, findQueryEditor],
  )

  // When the tool opens, or is shown again after another tool, unless the focus is already in it,
  // in a field or in an overlay. Touch screens are left alone: the editor would open the
  // on-screen keyboard over the tool
  useEffect(() => {
    if (!rootElement) return undefined
    const from = document.activeElement
    if (from && from !== document.body) {
      if (rootElement.contains(from) || from.closest(KEEPS_FOCUS)) return undefined
    }
    if (window.matchMedia?.('(pointer: coarse)').matches) return undefined
    return focusShownEditor(from)
  }, [focusShownEditor, rootElement])

  // The buttons, the keys of a focused tab and the shortcuts all open, close and switch tabs
  // through these, so closing from the keyboard does what the close button does
  const addTab = useCallback(() => actorRef.send({type: 'tab.add'}), [actorRef])
  // Restore tabs keeps a closed tab as its editors showed it: a params edit still in the debounce
  // is committed first, since the tab is gone by the time its editor unmounts and commits it
  const closeTab = useCallback(
    (id: string) => {
      pendingEdits.commit()
      actorRef.send({type: 'tab.close', id})
    },
    [actorRef, pendingEdits],
  )
  const selectTab = useCallback(
    (id: string) => {
      if (id !== actorRef.getSnapshot().context.activeTabId) telemetry.tabUsed('select')
      actorRef.send({type: 'tab.select', id})
    },
    [actorRef, telemetry],
  )

  // A shortcut hides or closes the tab that has the focus, and the next one must still land in
  // the tool. The focus moves to the tab shown now: onto the tab itself when the shortcut was
  // pressed in the strip, as the arrow keys do, and otherwise into its query editor. The tab gets
  // it when the editor cannot take it, as in the phone layout while the result is shown.
  const focusShownTab = useCallback(
    (onTab: boolean) => {
      // The tab shown next may be brand new, and a tab shown again recreates its editor: neither
      // is there until React has rendered the change, which it does before the next frame
      const id = actorRef.getSnapshot().context.activeTabId
      requestAnimationFrame(() => {
        const editor = onTab ? null : findQueryEditor(id)
        editor?.focus({preventScroll: true})
        if (!editor?.contains(document.activeElement)) focusTab(id)
      })
    },
    [actorRef, findQueryEditor, focusTab],
  )

  // A tab activated with Enter or Space keeps the focus, as the arrow keys leave it on the tabs,
  // and so does one tapped on a touch screen
  const selectTabByClick = useCallback(
    (id: string, event: MouseEvent<HTMLButtonElement>) => {
      selectTab(id)
      const native = event.nativeEvent
      if (event.detail === 0 || ('pointerType' in native && native.pointerType === 'touch')) return
      focusShownEditor(document.activeElement)
    },
    [focusShownEditor, selectTab],
  )
  const addTabByClick = useCallback(() => {
    addTab()
    focusShownEditor(document.activeElement)
  }, [addTab, focusShownEditor])

  useVisionTabShortcuts({
    rootElement,
    onShortcut: (shortcut, event) => {
      const inStrip =
        event.target instanceof Node && Boolean(listRef.current?.contains(event.target))
      telemetry.shortcutUsed(shortcut)
      setKeyboardDriven(true)
      switch (shortcut) {
        case 'new-tab':
          addTab()
          break
        case 'close-tab':
          closeTab(activeTabId)
          break
        case 'next-tab':
        case 'previous-tab': {
          const index = tabs.findIndex((tab) => tab.id === activeTabId)
          const step = shortcut === 'next-tab' ? 1 : -1
          const next = tabs[(index + step + tabs.length) % tabs.length]
          // A single tab has no other to switch to, so the focus stays where it is
          if (next.id === activeTabId) return
          selectTab(next.id)
          break
        }
        default: {
          const unhandled: never = shortcut
          throw new Error(`Unhandled tab shortcut: ${unhandled}`)
        }
      }
      focusShownTab(inStrip && shortcut !== 'new-tab')
    },
  })

  // Renaming swaps the tab button for an input. When Enter or Escape ends it, focus is still
  // in the strip and returns to the button once React has rendered it again, so Tab does not
  // leave the strip; a click elsewhere (blur) keeps the focus where the user put it.
  const stopRenaming = useCallback(
    (id: string) => {
      const focusInStrip = listRef.current?.contains(document.activeElement) ?? false
      setEditingId(null)
      if (focusInStrip) requestAnimationFrame(() => focusTab(id))
    },
    [focusTab],
  )

  // Keep the active tab whole in the strip when it changes, a new tab included, and when tabs open
  // without being shown, as the saved queries do ahead of it, clear of the new tab button pinned
  // over the right edge. Closing a tab leaves the strip where the user scrolled it. Layout offsets
  // rather than bounding boxes, so a tab that is still scaling in or sliding into place measures
  // where it ends up.
  const tabCount = tabs.length
  const keptInViewRef = useRef<{activeTabId: string; tabCount: number} | null>(null)
  useLayoutEffect(() => {
    const previous = keptInViewRef.current
    keptInViewRef.current = {activeTabId, tabCount}
    if (previous?.activeTabId === activeTabId && tabCount <= previous.tabCount) return
    const bar = barRef.current
    const item = listRef.current
      ?.querySelector(`#${getQueryTabId(activeTabId)}`)
      ?.closest<HTMLElement>('[data-testid="vision-tab-item"]')
    if (!bar || !item) return
    const visibleWidth = bar.clientWidth - (newTabSlotRef.current?.offsetWidth ?? 0)
    if (item.offsetLeft < bar.scrollLeft) bar.scrollLeft = item.offsetLeft
    else if (item.offsetLeft + item.offsetWidth > bar.scrollLeft + visibleWidth) {
      bar.scrollLeft = item.offsetLeft + item.offsetWidth - visibleWidth
    }
  }, [activeTabId, tabCount])

  const reorder = useCallback(
    (ordered: VisionTab[]) =>
      actorRef.send({type: 'tab.reorder', ids: ordered.map((tab) => tab.id)}),
    [actorRef],
  )
  // A drag reorders on every swap it passes, so it is recorded once, when it ends
  const draggedRef = useRef(false)
  const reorderByDrag = useCallback(
    (ordered: VisionTab[]) => {
      draggedRef.current = true
      reorder(ordered)
    },
    [reorder],
  )
  const handleDragEnd = useCallback(() => {
    if (!draggedRef.current) return
    draggedRef.current = false
    telemetry.tabUsed('reorder')
  }, [telemetry])

  // The ARIA tabs keyboard pattern: arrows, Home and End move between tabs and activate them,
  // Delete closes the focused tab (the close button itself stays out of the tab order) and F2
  // renames it. Shift with an arrow moves the tab instead, the keyboard counterpart of dragging it.
  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (tabs.length === 0) return
      if (event.key === 'F2') {
        event.preventDefault()
        setEditingId(activeTabId)
        return
      }
      if (event.key === 'Delete') {
        event.preventDefault()
        setKeyboardDriven(true)
        closeTab(activeTabId)
        focusShownTab(true)
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
        setKeyboardDriven(true)
        reorder(ordered)
        telemetry.tabUsed('reorder')
        return
      }
      let nextIndex: number | undefined
      if (direction !== 0) nextIndex = (index + direction + tabs.length) % tabs.length
      if (event.key === 'Home') nextIndex = 0
      if (event.key === 'End') nextIndex = tabs.length - 1
      if (nextIndex === undefined) return
      event.preventDefault()
      const next = tabs[nextIndex]
      selectTab(next.id)
      focusTab(next.id)
    },
    [activeTabId, closeTab, focusShownTab, focusTab, reorder, selectTab, tabs, telemetry],
  )

  useOverlayScrollThumb({
    scrollerRef: barRef,
    contentRef: listRef,
    thumbRef: scrollThumbRef,
    endInsetRef: newTabSlotRef,
  })

  return (
    <div className={styles.tabStrip}>
      <Flex
        alignItems="stretch"
        className={styles.tabBar}
        data-testid="vision-tab-bar"
        flexShrink={0}
        onPointerDownCapture={() => setKeyboardDriven(false)}
        ref={barRef}
      >
        <Reorder.Group
          aria-label={t('vision.tabs.label')}
          as="div"
          axis="x"
          className={styles.tabList}
          onReorder={reorderByDrag}
          ref={listRef}
          role="tablist"
          values={tabs}
        >
          {tabs.map((tab) => (
            <TabHandle
              editing={editingId === tab.id}
              entering={enteringIds.has(tab.id)}
              key={tab.id}
              layoutTransition={layoutTransition}
              listRef={listRef}
              onDragEnd={handleDragEnd}
              onKeyDown={handleTabKeyDown}
              onCancelRename={() => stopRenaming(tab.id)}
              onClose={() => closeTab(tab.id)}
              onRename={(title, changed) => {
                stopRenaming(tab.id)
                actorRef.send({type: 'tab.rename', id: tab.id, title})
                if (changed) telemetry.tabUsed('rename')
              }}
              onSelect={(event) => selectTabByClick(tab.id, event)}
              onStartRename={() => setEditingId(tab.id)}
              selected={tab.id === activeTabId}
              shared={findSharedQuery(tab, queries) !== undefined}
              tab={tab}
            />
          ))}
        </Reorder.Group>
        <div className={styles.newTabSlot} ref={newTabSlotRef}>
          <VisionTooltip
            content={t('vision.tabs.new-tab')}
            hotkeys={VISION_TAB_SHORTCUTS['new-tab'].keys}
            placement="bottom"
          >
            <Button
              aria-label={t('vision.tabs.new-tab')}
              className={styles.newTabButton}
              data-testid="vision-new-tab"
              fontSize={1}
              icon={AddIcon}
              mode="bleed"
              onClick={addTabByClick}
              padding={2}
              radius={0}
            />
          </VisionTooltip>
        </div>
      </Flex>
      <div
        aria-hidden
        className={styles.tabScrollThumb}
        data-testid="vision-tab-scroll-thumb"
        ref={scrollThumbRef}
      />
    </div>
  )
}
