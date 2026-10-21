import {CommentIcon} from '@sanity/icons/Comment'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {RestoreIcon} from '@sanity/icons/Restore'
import {SyncIcon} from '@sanity/icons/Sync'
import {TransferIcon} from '@sanity/icons/Transfer'
import {type ComponentType, useContext, useEffect} from 'react'
import {CommentsContext} from 'sanity/_singletons'
import {useDocumentPane, usePaneRouter} from 'sanity/structure'

// The panels that read beside the form (spec A1, I1): Versions, History, Review changes, References, Comments. One model for both ways of
// reaching them (the tab row in the inspector, or the icons in the pane header), so they never disagree about what is open.

const INVENTORY = 'variants-inventory'
const HISTORY = 'sanity/structure/history'
const REFERENCES = 'sanity/structure/incoming-references'
const COMMENTS = 'sanity/comments'
const VALIDATION = 'sanity/structure/validation'

export interface Panel {
  id: string
  title: string
  icon: ComponentType
  /** The number badge (Comments). */
  count?: number
  active: boolean
  /** Open this panel (History and Review changes are one inspector with two params). */
  select: () => void
}

const KNOWN: {
  id: string
  inspector: string
  tab?: 'history' | 'review'
  title: string
  icon: ComponentType
}[] = [
  {id: 'versions', inspector: INVENTORY, title: 'Versions', icon: DocumentsIcon},
  {id: 'history', inspector: HISTORY, tab: 'history', title: 'History', icon: RestoreIcon},
  {id: 'review', inspector: HISTORY, tab: 'review', title: 'Review changes', icon: TransferIcon},
  {id: 'references', inspector: REFERENCES, title: 'References', icon: SyncIcon},
  {id: 'comments', inspector: COMMENTS, title: 'Comments', icon: CommentIcon},
]

// The panel last used, so the header's pill opens on it (H4): Versions the first time. Studio-wide, per tab of the browser.
let lastPanelId = 'versions'
export const lastPanel = () => lastPanelId

const label = (name: string) =>
  name
    .split('/')
    .pop()!
    .replace(/[-_]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())

/** The panels of this document pane, in order, with the open one marked. Validation is not one (H5). */
export function useInspectorPanels(): {
  panels: Panel[]
  activeId: string | undefined
  close: () => void
} {
  const {inspector, inspectors, openInspector, closeInspector} = useDocumentPane()
  const {params} = usePaneRouter()
  const comments = useContext(CommentsContext)
  const reviewTab = params?.changesInspectorTab === 'review' ? 'review' : 'history'
  const names = new Set(inspectors.map((i) => i.name))

  const panels: Panel[] = [
    ...KNOWN.filter((k) => names.has(k.inspector)).map((k) => ({
      id: k.id,
      title: k.title,
      icon: k.icon,
      count: k.id === 'comments' ? comments?.comments.data.open.length || undefined : undefined,
      active: inspector?.name === k.inspector && (k.tab === undefined || k.tab === reviewTab),
      select: () => openInspector(k.inspector, k.tab ? {changesInspectorTab: k.tab} : undefined),
    })),
    // Inspectors a plugin adds follow the known ones.
    ...inspectors
      .filter((i) => i.name !== VALIDATION && !KNOWN.some((k) => k.inspector === i.name))
      .map((i) => ({
        id: i.name,
        title: label(i.name),
        icon: DocumentsIcon,
        active: inspector?.name === i.name,
        select: () => openInspector(i.name),
      })),
  ]
  const activeId = panels.find((p) => p.active)?.id
  useEffect(() => {
    if (activeId) lastPanelId = activeId
  }, [activeId])
  return {
    panels,
    activeId,
    close: () => {
      if (inspector) closeInspector(inspector.name)
    },
  }
}
