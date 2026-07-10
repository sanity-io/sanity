import {useGlobalKeyDown} from '@sanity/ui'
import {type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {getPublishedId} from 'sanity'
import {DocumentListSelectionContext} from 'sanity/_singletons'

import {type DocumentListPaneItem} from '../types'
import {type DocumentListSelectionContextValue, type PaneItemMenuTarget} from './types'

const EMPTY_SELECTION = new Set<string>()

/**
 * Read the document list selection model. Returns `null` when the surface is
 * not wrapped in a `DocumentListSelectionProvider` (e.g. list panes of
 * non-document items), in which case rows render as plain navigational rows.
 *
 * @internal
 */
export function useDocumentListSelection(): DocumentListSelectionContextValue | null {
  return useContext(DocumentListSelectionContext)
}

/**
 * Holds the selection model for one document list pane: which rows are
 * selected (keyed by published ID), range-selection over the loaded item
 * order, and the shared row context menu target.
 *
 * @internal
 */
export function DocumentListSelectionProvider(props: {
  children: ReactNode
  items: DocumentListPaneItem[]
  /** Selection is pane-scoped: it resets when the pane's identity changes. */
  paneKey: string
}) {
  const {children, items, paneKey} = props

  const [selection, setSelection] = useState<Set<string>>(EMPTY_SELECTION)
  const [itemMenu, setItemMenu] = useState<PaneItemMenuTarget | null>(null)

  useEffect(() => {
    // The pane component instance is reused across navigations; drop the
    // previous pane's selection instead of carrying stale IDs over.
    // oxlint-disable-next-line react/react-compiler
    setSelection(EMPTY_SELECTION)
    setItemMenu(null)
  }, [paneKey])

  // Anchor of the next shift-range selection: the row most recently toggled.
  const lastToggledIdRef = useRef<string | null>(null)

  // The loaded rows, in list order, keyed by published ID. `getPublishedId`
  // returns a branded `PublishedId`; this model's public API is deliberately
  // plain `string` (consumers pass generic pane-item ids), so widen back here
  // rather than threading the branded type through the whole provider.
  const orderedIds = useMemo((): string[] => items.map((item) => getPublishedId(item._id)), [items])
  const typeById = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of items) map.set(getPublishedId(item._id), item._type)
    return map
  }, [items])

  const isSelected = useCallback((publishedId: string) => selection.has(publishedId), [selection])

  const toggle = useCallback((publishedId: string) => {
    lastToggledIdRef.current = publishedId
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(publishedId)) {
        next.delete(publishedId)
      } else {
        next.add(publishedId)
      }
      return next
    })
  }, [])

  const selectRange = useCallback(
    (publishedId: string) => {
      const fromId = lastToggledIdRef.current
      const fromIndex = fromId ? orderedIds.indexOf(fromId) : -1
      if (fromIndex === -1) {
        toggle(publishedId)
        return
      }
      const toIndex = orderedIds.indexOf(publishedId)
      if (toIndex === -1) return
      const [start, end] = fromIndex < toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex]
      // note: the anchor intentionally stays on the last *toggled* row so
      // consecutive shift-clicks re-extend from the same anchor
      setSelection((prev) => {
        const next = new Set(prev)
        for (let i = start; i <= end; i++) next.add(orderedIds[i])
        return next
      })
    },
    [orderedIds, toggle],
  )

  const selectAll = useCallback(() => {
    setSelection(new Set(orderedIds))
  }, [orderedIds])

  const clearSelection = useCallback(() => {
    lastToggledIdRef.current = null
    setSelection(EMPTY_SELECTION)
  }, [])

  const getItemType = useCallback((publishedId: string) => typeById.get(publishedId), [typeById])

  const openItemMenu = useCallback((target: PaneItemMenuTarget) => setItemMenu(target), [])
  const closeItemMenu = useCallback(() => setItemMenu(null), [])

  // Active only when selected rows actually exist in the loaded list —
  // IDs lingering from a previous list (or filtered out) don't count.
  const selectedIds = useMemo(
    () => orderedIds.filter((id) => selection.has(id)),
    [orderedIds, selection],
  )
  const selectionActive = selectedIds.length > 0

  // Escape exits selection mode (and closes the row menu first, if open).
  // The menu itself also closes on Escape via its own handler; this guard
  // only clears the selection once nothing else is open.
  useGlobalKeyDown(
    useCallback(
      (event: KeyboardEvent) => {
        if (event.key !== 'Escape' || !selectionActive) return
        if (itemMenu) return
        clearSelection()
      },
      [selectionActive, itemMenu, clearSelection],
    ),
  )

  const listItems = useMemo(
    () =>
      items.map((item) => ({
        documentId: getPublishedId(item._id),
        documentType: item._type,
      })),
    [items],
  )

  const value = useMemo<DocumentListSelectionContextValue>(
    () => ({
      selectedIds,
      selectionActive,
      isSelected,
      toggle,
      selectRange,
      selectAll,
      clearSelection,
      itemCount: orderedIds.length,
      getItemType,
      paneKey,
      listItems,
      itemMenu,
      openItemMenu,
      closeItemMenu,
    }),
    [
      selectedIds,
      selectionActive,
      isSelected,
      toggle,
      selectRange,
      selectAll,
      clearSelection,
      orderedIds.length,
      getItemType,
      paneKey,
      listItems,
      itemMenu,
      openItemMenu,
      closeItemMenu,
    ],
  )

  return (
    <DocumentListSelectionContext.Provider value={value}>
      {children}
    </DocumentListSelectionContext.Provider>
  )
}
