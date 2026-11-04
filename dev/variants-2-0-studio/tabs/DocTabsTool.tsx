import {
  type ComponentType,
  type DragEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import {type Tool, useDocumentValues, useSchema} from 'sanity'
import {useRouter, useRouterState} from 'sanity/router'

import {groupsOf, pathOf} from '../compare/address'
import {useOption} from '../options/store'
import {
  ensureTab,
  getTabs,
  idOf,
  moveTab,
  removeTab,
  say,
  setListOpen,
  setSplit,
  type Tab,
  useTabs,
} from './store'

// Document tabs (docTabs b and c). A bar above the Structure tool. The URL says what is open; the store says which documents are tabs.
// Keyboard model: tabs/KEYBOARD-MODEL.md.

const PANEL_ID = 'doc-tabs-panel'
const tabDomId = (id: string) => `doc-tab-${id}`

type Mode = 'a' | 'b' | 'c'

/** The structure path as the bar reads it: the list group, then the document groups. */
function readPath(pathname: string = window.location.pathname) {
  const groups = groupsOf(pathname)
  if (!groups || groups.length === 0) return null
  return {list: groups[0], docs: groups.slice(1)}
}

/**
 * The group a tab opens as: its own document and params, with the panel (`inspect=`) of the document on screen. A panel stays open across a switch
 * (K4), and a panel opened after the tab was made is not lost to the group saved with it.
 */
function carryPanel(tabGroup: string, currentGroup: string | undefined) {
  const own = tabGroup.split(',').filter((part) => !part.startsWith('inspect='))
  const panel = currentGroup?.split(',').find((part) => part.startsWith('inspect='))
  return [...own, ...(panel ? [panel] : [])].join(',')
}

function docTab(list: string, group: string): Tab {
  const type =
    group
      .split(',')
      .find((p) => p.startsWith('type='))
      ?.slice(5) ?? list
  return {id: idOf(group), type, group: carryPanel(group, undefined)}
}

function useTitle(tab: Tab) {
  const schema = useSchema()
  const type = schema.get(tab.type)
  const value = useDocumentValues<{title?: string; name?: string}>(tab.id, ['title', 'name']).value
  const title = value?.title ?? value?.name
  return {
    title: typeof title === 'string' && title ? title : (type?.title ?? tab.type),
    Icon: type?.icon,
  }
}

function TabItem(props: {
  tab: Tab
  index: number
  count: number
  active: boolean
  split: boolean
  focusable: boolean
  onActivate: (id: string) => void
  onClose: (id: string) => void
  onSplit: (id: string) => void
  onKey: (event: KeyboardEvent<HTMLElement>, tab: Tab) => void
  onDropOn: (from: string, to: string) => void
}) {
  const {
    tab,
    index,
    count,
    active,
    split,
    focusable,
    onActivate,
    onClose,
    onSplit,
    onKey,
    onDropOn,
  } = props
  const {title, Icon} = useTitle(tab)
  const [over, setOver] = useState(false)
  const onDragStart = (event: DragEvent) => {
    event.dataTransfer.setData('text/plain', tab.id)
    event.dataTransfer.effectAllowed = 'move'
  }
  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setOver(false)
    onDropOn(event.dataTransfer.getData('text/plain'), tab.id)
  }
  return (
    <div
      className="dt-tab"
      data-active={active || undefined}
      data-split={split || undefined}
      data-over={over || undefined}
      draggable
      onDragOver={(event) => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      <button
        aria-controls={PANEL_ID}
        aria-label={`${title}${split ? ', split beside the active tab' : ''}`}
        aria-posinset={index + 1}
        aria-selected={active}
        aria-setsize={count}
        className="dt-tab-main"
        data-tab-id={tab.id}
        id={tabDomId(tab.id)}
        onClick={() => onActivate(tab.id)}
        onKeyDown={(event) => onKey(event, tab)}
        role="tab"
        tabIndex={focusable ? 0 : -1}
        type="button"
      >
        {Icon ? <Icon aria-hidden /> : null}
        <span className="dt-tab-title">{title}</span>
      </button>
      {/* The pointer's controls are not tab stops: the keyboard has Shift+Enter (split) and Delete (close) on the tab itself. */}
      {!active ? (
        <button
          aria-label={`Split ${title} beside the active tab`}
          className="dt-tab-aux"
          onClick={() => onSplit(tab.id)}
          tabIndex={-1}
          title="Split beside the active tab"
          type="button"
        >
          ◫
        </button>
      ) : null}
      <button
        aria-label={`Close ${title}`}
        className="dt-tab-aux"
        onClick={() => onClose(tab.id)}
        tabIndex={-1}
        title="Close"
        type="button"
      >
        ×
      </button>
    </div>
  )
}

const BAR_CSS = `
.dt-bar{display:flex;align-items:stretch;gap:0;height:41px;flex:none;border-bottom:1px solid var(--card-border-color);background:var(--card-bg-color);color:var(--card-fg-color);font:inherit;font-size:13px;}
.dt-crumb{display:flex;align-items:center;gap:6px;padding:0 14px;border:0;border-right:1px solid var(--card-border-color);background:transparent;color:inherit;font:inherit;font-weight:600;cursor:pointer;white-space:nowrap;}
.dt-crumb:hover{background:var(--card-hovered-bg-color,rgba(127,127,127,.12));}
.dt-sep{display:flex;align-items:center;padding:0 10px;opacity:.5;}
.dt-here{display:flex;align-items:center;padding:0 12px 0 0;white-space:nowrap;}
.dt-list{display:flex;align-items:stretch;min-width:0;flex:1 1 auto;overflow-x:auto;scrollbar-width:none;}
.dt-tab{display:flex;align-items:center;gap:2px;padding:0 4px 0 0;border-right:1px solid var(--card-border-color);flex:0 1 200px;min-width:96px;box-shadow:inset 0 -2px 0 transparent;}
.dt-tab[data-active]{background:var(--card-hovered-bg-color,rgba(127,127,127,.14));box-shadow:inset 0 -2px 0 var(--card-fg-color);}
.dt-tab[data-split]{box-shadow:inset 0 -2px 0 var(--card-muted-fg-color);}
.dt-tab[data-over]{outline:2px dashed var(--card-focus-ring-color,#256fef);outline-offset:-2px;}
.dt-tab-main{display:flex;align-items:center;gap:8px;flex:1;min-width:0;height:100%;padding:0 6px 0 12px;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;}
.dt-tab-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dt-tab-aux{flex:none;width:22px;height:22px;border:0;border-radius:4px;background:transparent;color:var(--card-muted-fg-color);font:inherit;line-height:1;cursor:pointer;opacity:0;}
.dt-tab:hover .dt-tab-aux,.dt-tab[data-active] .dt-tab-aux,.dt-tab-aux:focus-visible{opacity:1;}
.dt-tab-aux:hover{background:rgba(127,127,127,.2);color:var(--card-fg-color);}
.dt-crumb:focus-visible,.dt-tab-main:focus-visible,.dt-tab-aux:focus-visible{outline:2px solid var(--card-focus-ring-color,#256fef);outline-offset:-2px;}
.dt-live{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}
.dt-root[data-fold] [data-ui="ListPane"],.dt-root[data-fold] [data-ui="DocumentListPane"],.dt-root[data-fold] [data-ui="DocumentListPane"] + [data-ui="Layer"],.dt-root[data-fold] [data-ui="Layer"]:has(+ [data-ui="DocumentListPane"]){display:none !important;}
.dt-root[data-fold][data-list-open] [data-ui="DocumentListPane"]{display:block !important;position:absolute;left:0;top:0;bottom:0;width:340px !important;z-index:5;box-shadow:0 8px 24px rgba(0,0,0,.35);}
`

/** The tab bar and its tabpanel around the Structure tool. */
function DocTabsFrame({
  mode,
  Tool,
  tool,
}: {
  mode: Mode
  Tool: ComponentType<{tool: Tool}>
  tool: Tool
}) {
  const router = useRouter()
  // Re-reads the address whenever the router's state changes (the selector runs per render; the address is the browser's).
  const pathname = useRouterState(() => window.location.pathname)
  const schema = useSchema()
  const {tabs, split, listOpen, announce} = useTabs()
  const [focusId, setFocusId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const path = readPath(pathname)
  const list = path?.list
  const docs = path?.docs ?? []
  const activeId = docs.length ? idOf(docs[0]) : null
  const splitId = docs.length > 1 ? idOf(docs[1]) : null
  const tabbed = mode === 'b'

  const go = (groups: string[], replace = false) => {
    router.navigateUrl({path: pathOf(groups) + window.location.search, replace})
  }

  // The URL is the truth. A document that arrives as an extra pane (a reference) becomes a tab, and the URL is rewritten to the one document
  // (or, on a split, the two). The same document twice is a comparison: it is left to the stock panes.
  useEffect(() => {
    const now = readPath(pathname)
    if (!now || now.docs.length === 0) return
    const ids = now.docs.map(idOf)
    if (new Set(ids).size < ids.length) return
    const current = getTabs()
    const keepSplit = tabbed && now.docs.length === 2 && current.split === ids[1]
    let docsNow = now.docs
    if (now.docs.length >= 2 && !keepSplit) {
      docsNow = [now.docs[now.docs.length - 1]]
      router.navigateUrl({
        path: pathOf([now.list, ...docsNow]) + window.location.search,
        replace: true,
      })
    }
    if (!keepSplit && current.split) setSplit(null)
    if (tabbed) {
      const tab = docTab(now.list, docsNow[0])
      if (ensureTab(tab)) {
        const count = getTabs().tabs.length
        say(`${tab.id} opened in a new tab, tab ${count} of ${count}`)
      }
    }
    setListOpen(false)
  }, [pathname, router, tabbed])

  // Escape closes the unfolded list.
  useEffect(() => {
    if (!listOpen) return undefined
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setListOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [listOpen])

  // Alt+] and Alt+[ : the next and the previous tab from anywhere (the form, a panel). Not the browser's own tab keys, which a page cannot take.
  useEffect(() => {
    if (!tabbed) return undefined
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (!event.altKey || (event.code !== 'BracketRight' && event.code !== 'BracketLeft')) return
      const {tabs: all} = getTabs()
      const now = readPath()
      if (!now || all.length < 2 || now.docs.length === 0) return
      event.preventDefault()
      const at = all.findIndex((t) => t.id === idOf(now.docs[0]))
      const step = event.code === 'BracketRight' ? 1 : -1
      const next = all[(at + step + all.length) % all.length]
      router.navigateUrl({
        path: pathOf([now.list, carryPanel(next.group, now.docs[0])]) + window.location.search,
      })
      say(`Switched to tab ${all.indexOf(next) + 1} of ${all.length}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tabbed, router])

  const label = (id: string) =>
    listRef.current?.querySelector(`[data-tab-id="${CSS.escape(id)}"] .dt-tab-title`)
      ?.textContent ?? id

  const focusLater = (id: string | undefined) => {
    if (!id) return
    for (const wait of [0, 150, 500])
      setTimeout(
        () =>
          listRef.current?.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(id)}"]`)?.focus(),
        wait,
      )
  }

  const activate = (id: string) => {
    const tab = tabs.find((t) => t.id === id)
    if (!tab || !list) return
    const keepSplit = split && split !== id ? [tabs.find((t) => t.id === split)?.group ?? ''] : []
    go([list, carryPanel(tab.group, docs[0]), ...keepSplit.filter(Boolean)])
    say(`Switched to ${label(id)}, tab ${tabs.indexOf(tab) + 1} of ${tabs.length}`)
  }

  const close = (id: string) => {
    if (!list) return
    const at = tabs.findIndex((t) => t.id === id)
    const rest = tabs.filter((t) => t.id !== id)
    const name = label(id)
    removeTab(id)
    if (id === activeId) {
      const next = rest[Math.min(at, rest.length - 1)]
      go(next ? [list, carryPanel(next.group, docs[0])] : [list])
      setFocusId(next?.id ?? null)
      focusLater(next?.id)
      say(
        next
          ? `Closed ${name}. ${label(next.id)}, tab ${rest.indexOf(next) + 1} of ${rest.length}`
          : `Closed ${name}. No tabs open`,
      )
    } else {
      if (split === id && activeId)
        go([list, tabs.find((t) => t.id === activeId)?.group ?? activeId])
      const next = rest[Math.min(at, rest.length - 1)]
      setFocusId(next?.id ?? null)
      focusLater(next?.id)
      say(`Closed ${name}. ${rest.length} ${rest.length === 1 ? 'tab' : 'tabs'} open`)
    }
  }

  const splitBeside = (id: string) => {
    const tab = tabs.find((t) => t.id === id)
    const active = tabs.find((t) => t.id === activeId)
    if (!tab || !active || !list || id === activeId) return
    setSplit(id)
    go([list, docs[0] ?? active.group, tab.group])
    say(`${label(id)} split beside ${label(active.id)}`)
  }

  const onDropOn = (from: string, to: string) => {
    if (!from || from === to) return
    moveTab(
      from,
      tabs.findIndex((t) => t.id === to),
    )
    say(
      `Moved ${label(from)} to position ${getTabs().tabs.findIndex((t) => t.id === from) + 1} of ${tabs.length}`,
    )
  }

  const onKey = (event: KeyboardEvent<HTMLElement>, tab: Tab) => {
    const at = tabs.findIndex((t) => t.id === tab.id)
    const mod = event.metaKey || event.ctrlKey
    const focusTab = (id: string) => {
      setFocusId(id)
      listRef.current?.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(id)}"]`)?.focus()
    }
    if (mod && event.shiftKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault()
      const to = at + (event.key === 'ArrowRight' ? 1 : -1)
      if (to < 0 || to >= tabs.length) return
      moveTab(tab.id, to)
      say(`Moved ${label(tab.id)} to position ${to + 1} of ${tabs.length}`)
      requestAnimationFrame(() => focusTab(tab.id))
      return
    }
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        focusTab(tabs[(at + 1) % tabs.length].id)
        return
      case 'ArrowLeft':
        event.preventDefault()
        focusTab(tabs[(at - 1 + tabs.length) % tabs.length].id)
        return
      case 'Home':
        event.preventDefault()
        focusTab(tabs[0].id)
        return
      case 'End':
        event.preventDefault()
        focusTab(tabs[tabs.length - 1].id)
        return
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (event.shiftKey) splitBeside(tab.id)
        else activate(tab.id)
        // The document pane remounts on a switch and focus would fall to the page: the tab keeps it (K9).
        for (const wait of [0, 150, 500]) setTimeout(() => focusTab(tab.id), wait)
        return
      case 'Delete':
        event.preventDefault()
        close(tab.id)
        return
      default:
        if (mod && event.key.toLowerCase() === 'w') {
          event.preventDefault()
          close(tab.id)
        }
    }
  }

  const listTitle = list ? (schema.get(list)?.title ?? list) : 'Content'
  const rovingId =
    focusId && tabs.some((t) => t.id === focusId) ? focusId : (activeId ?? tabs[0]?.id)
  const here = activeId ? tabs.find((t) => t.id === activeId) : undefined

  return (
    <div
      className="dt-root"
      data-fold={activeId ? '' : undefined}
      data-list-open={listOpen ? '' : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        position: 'relative',
      }}
    >
      <style>{BAR_CSS}</style>
      <div className="dt-bar" data-testid="doc-tabs-bar">
        <button
          aria-expanded={listOpen}
          className="dt-crumb"
          data-testid="doc-tabs-breadcrumb"
          onClick={() => setListOpen(!listOpen)}
          type="button"
        >
          {listTitle} <span aria-hidden>{listOpen ? '▴' : '▾'}</span>
        </button>
        {tabbed ? (
          <div
            aria-label="Open documents"
            aria-orientation="horizontal"
            className="dt-list"
            ref={listRef}
            role="tablist"
          >
            {tabs.map((tab, index) => (
              <TabItem
                active={tab.id === activeId}
                count={tabs.length}
                focusable={tab.id === rovingId}
                index={index}
                key={tab.id}
                onActivate={activate}
                onClose={close}
                onDropOn={onDropOn}
                onKey={onKey}
                onSplit={splitBeside}
                split={tab.id === splitId}
                tab={tab}
              />
            ))}
          </div>
        ) : (
          <>
            <span aria-hidden className="dt-sep">
              ›
            </span>
            <span className="dt-here" data-testid="doc-tabs-here">
              {here ? (
                <HereTitle tab={here} />
              ) : activeId && list ? (
                <HereTitle tab={docTab(list, docs[0])} />
              ) : null}
            </span>
          </>
        )}
        <output aria-atomic="true" aria-live="polite" className="dt-live">
          {announce.text}
          {announce.tick % 2 ? '​' : ''}
        </output>
      </div>
      <div
        aria-labelledby={activeId ? tabDomId(activeId) : undefined}
        id={PANEL_ID}
        role={tabbed ? 'tabpanel' : undefined}
        style={{flex: '1 1 0%', minHeight: 0, position: 'relative'}}
      >
        <Tool tool={tool} />
      </div>
    </div>
  )
}

function HereTitle({tab}: {tab: Tab}) {
  return <>{useTitle(tab).title}</>
}

const wrapped = new WeakMap<ComponentType<{tool: Tool}>, ComponentType<{tool: Tool}>>()

/** The Structure tool with the tab bar above it. With `docTabs` off it renders the tool as it is. */
export function withDocTabs(Original: ComponentType<{tool: Tool}>): ComponentType<{tool: Tool}> {
  const known = wrapped.get(Original)
  if (known) return known
  function DocTabsTool(props: {tool: Tool}) {
    const mode = useOption('docTabs') as Mode
    if (mode !== 'b' && mode !== 'c') return <Original tool={props.tool} />
    return <DocTabsFrame Tool={Original} mode={mode} tool={props.tool} />
  }
  wrapped.set(Original, DocTabsTool)
  return DocTabsTool
}
