import {
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type MouseEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {isVariantId, useSetVariant} from 'sanity'
import {PaneRouterContext} from 'sanity/_singletons'
import {useRouter} from 'sanity/router'

import {Popover} from '../../../ui-components/popover/Popover'
import {DOCUMENT_GROUP_INSPECTOR_NAME} from '../../panes/document/constants'
import {insideTriangle, type Point} from './hoverIntent'

/** Attribute on the row of a document list item the flyout opens from. */
const PANE_ITEM_ROW_ATTRIBUTE = 'data-pane-item-row'

const DOTS_STYLE = {display: 'contents'} as const

/** How long the pointer rests on a row before its flyout opens, so sweeping down a list shows none. */
export const OPEN_DELAY = 300
/** How long the flyout stays open after the pointer left the row and the flyout. */
export const CLOSE_DELAY = 150
/** How long the pointer may rest inside the safe triangle on its way to the flyout. */
const STALL_DELAY = 250

/** The actions the flyout's content calls. */
export interface PaneItemVersionsFlyoutActions {
  /** Opens the document with the document group inventory beside it, in the version it shows. */
  onOpenInventory: () => void
  /**
   * Opens the document in the picked audience (`null` for the default one), with the inventory
   * beside it. `paneParams` are added to the document pane's params, next to `inspect` (the
   * `createVariant` param, see `CREATE_VARIANT_PARAM`).
   */
  onPick: (variantId: string | null, paneParams?: Record<string, string>) => void
}

/**
 * Whether a key event comes from the list the row is in while the row is the list's active item.
 * A document list is a `CommandList`: Tab focuses the list itself, its rows are never focused, and
 * the active row is the list's `aria-activedescendant`.
 */
function isActiveRowOfFocusedList(event: globalThis.KeyboardEvent, row: HTMLElement): boolean {
  const list = event.target
  if (!(list instanceof HTMLElement) || list === row || !list.contains(row)) return false
  const activeId = list.getAttribute('aria-activedescendant')
  return Boolean(activeId) && row.closest('[role="option"]')?.id === activeId
}

/**
 * The flyout of a document list row: the document's versions, opened by hovering anywhere on the
 * row (after a short delay), with ArrowRight when the row is the keyboard-active item of its list
 * (or is focused itself), or by a tap on the version dots (`children`) on a touch screen, which
 * has no hover. Picking a version opens the document in that version with the document group
 * inventory open beside it.
 *
 * Renders nothing in place: it finds its row through the `data-pane-item-row` ancestor and listens
 * there, and the flyout is portalled beside the row.
 *
 * @internal
 */
export function PaneItemVersionsFlyout(props: {
  childId: string
  /** The version dots of the row. A tap on them opens the flyout on a touch screen. */
  children?: ReactNode
  /** Renders the flyout's content. A pick or the inventory row opens the document and the inventory. */
  renderList: (actions: PaneItemVersionsFlyoutActions) => ReactNode
}) {
  const {childId, children, renderList} = props
  const {navigate} = useRouter()
  const setVariant = useSetVariant()
  const {routerPanesState, groupIndex} = useContext(PaneRouterContext)

  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const row = anchor?.closest<HTMLElement>(`[${PANE_ITEM_ROW_ATTRIBUTE}]`) ?? null
  const [open, setOpen] = useState(false)
  const flyoutRef = useRef<HTMLDivElement | null>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastPoint = useRef<Point | null>(null)
  const stopTracking = useRef<(() => void) | null>(null)
  const focusFirst = useRef(false)
  const touchToggled = useRef(false)
  const dotsRef = useRef<HTMLSpanElement | null>(null)
  /** What had focus when the keyboard opened the flyout (the list), to give it back on close. */
  const returnFocus = useRef<HTMLElement | null>(null)

  const clearTimers = useCallback(() => {
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
    stopTracking.current?.()
    stopTracking.current = null
  }, [])

  const close = useCallback(() => {
    clearTimers()
    setOpen(false)
  }, [clearTimers])

  // After a keyboard close, focus goes back to what had it when the keyboard opened the flyout:
  // the list, which still has this row as its active item, or the row itself.
  const restoreFocus = useCallback(() => {
    const target = returnFocus.current?.isConnected ? returnFocus.current : row
    returnFocus.current = null
    target?.focus()
  }, [row])

  const keepOpen = useCallback(() => {
    clearTimeout(closeTimer.current)
    stopTracking.current?.()
    stopTracking.current = null
  }, [])

  // The pointer left the row or the flyout: close after a short delay, unless it is travelling
  // from the row toward the flyout, which the safe triangle allows for.
  const closeSoon = useCallback(() => {
    clearTimeout(openTimer.current)
    keepOpen()
    const flyout = flyoutRef.current?.getBoundingClientRect()
    const from = lastPoint.current
    if (!flyout || !from) {
      closeTimer.current = setTimeout(close, CLOSE_DELAY)
      return
    }
    const near = flyout.left >= from.x ? flyout.left : flyout.right
    const a: Point = {x: near, y: flyout.top}
    const b: Point = {x: near, y: flyout.bottom}
    const stall = () => {
      clearTimeout(closeTimer.current)
      closeTimer.current = setTimeout(close, STALL_DELAY)
    }
    const move = (event: PointerEvent) => {
      const p = {x: event.clientX, y: event.clientY}
      const r = flyoutRef.current?.getBoundingClientRect()
      const inFlyout = !!r && p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom
      if (inFlyout) {
        // The flyout's own pointerenter takes over from here.
        keepOpen()
      } else if (insideTriangle(p, from, a, b)) {
        stall()
      } else {
        close()
      }
    }
    document.addEventListener('pointermove', move)
    stopTracking.current = () => document.removeEventListener('pointermove', move)
    closeTimer.current = setTimeout(close, CLOSE_DELAY + STALL_DELAY)
  }, [close, keepOpen])

  useEffect(() => {
    if (!row) return undefined

    const handleEnter = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      lastPoint.current = {x: event.clientX, y: event.clientY}
      keepOpen()
      clearTimeout(openTimer.current)
      openTimer.current = setTimeout(() => setOpen(true), OPEN_DELAY)
    }
    const handleMove = (event: PointerEvent) => {
      lastPoint.current = {x: event.clientX, y: event.clientY}
    }
    // A touch pointer leaves the row as soon as the finger lifts, which must not close a flyout the
    // tap just opened. It closes with another tap on the dots, a tap outside, Escape or scrolling.
    const handleLeave = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      closeSoon()
    }
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'ArrowRight') return
      if (event.target !== row && !isActiveRowOfFocusedList(event, row)) return
      event.preventDefault()
      event.stopPropagation()
      clearTimers()
      returnFocus.current = event.target as HTMLElement
      // Already open (hover opened it): the open effect will not run again, so focus it here
      const first = flyoutRef.current?.querySelector<HTMLElement>('[role="menuitem"]')
      if (first) {
        first.focus()
        return
      }
      focusFirst.current = true
      setOpen(true)
    }

    // The pointer may already be over the row when this mounts (the row's preview loads first), so
    // `pointerenter` has already fired
    if (row.matches(':hover') && window.matchMedia?.('(hover: hover)').matches) {
      openTimer.current = setTimeout(() => setOpen(true), OPEN_DELAY)
    }

    row.addEventListener('pointerenter', handleEnter)
    row.addEventListener('pointermove', handleMove)
    row.addEventListener('pointerleave', handleLeave)
    row.addEventListener('keydown', handleKeyDown)
    // The list, not the row, has focus while its arrow keys move the active row
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      row.removeEventListener('pointerenter', handleEnter)
      row.removeEventListener('pointermove', handleMove)
      row.removeEventListener('pointerleave', handleLeave)
      row.removeEventListener('keydown', handleKeyDown)
      clearTimers()
    }
  }, [clearTimers, closeSoon, keepOpen, row])

  // The row is the flyout's trigger: say that it opens a menu, and whether it is open.
  useEffect(() => {
    if (!row) return undefined
    row.setAttribute('aria-haspopup', 'menu')
    return () => {
      row.removeAttribute('aria-haspopup')
      row.removeAttribute('aria-expanded')
    }
  }, [row])
  useEffect(() => {
    row?.setAttribute('aria-expanded', String(open))
  }, [open, row])

  // A touch screen has no hover, so a tap on the dots opens the flyout (and a second tap closes
  // it). The tap would also follow the row's link, so the click that comes after it is stopped.
  const handleDotsPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      if (event.pointerType !== 'touch') return
      touchToggled.current = true
      clearTimers()
      setOpen((current) => !current)
    },
    [clearTimers],
  )
  const handleDotsClick = useCallback((event: MouseEvent<HTMLSpanElement>) => {
    if (!touchToggled.current) return
    touchToggled.current = false
    event.preventDefault()
    event.stopPropagation()
  }, [])

  // Escape and scrolling close it.
  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      const hadFocus = flyoutRef.current?.contains(document.activeElement) ?? false
      close()
      if (hadFocus) restoreFocus()
    }
    // A touch screen has no pointer leaving to close it: a tap outside the flyout and the dots does
    const handleTouchOutside = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      const target = event.target as Node | null
      if (flyoutRef.current?.contains(target) || dotsRef.current?.contains(target)) return
      close()
    }
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('scroll', close, true)
    document.addEventListener('pointerdown', handleTouchOutside, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('scroll', close, true)
      document.removeEventListener('pointerdown', handleTouchOutside, true)
    }
  }, [close, open, restoreFocus])

  // After a keyboard open, focus lands on the first item as soon as the flyout is on screen.
  useEffect(() => {
    if (!open || !focusFirst.current) return undefined
    let frame = requestAnimationFrame(function focus() {
      const first = flyoutRef.current?.querySelector<HTMLElement>('[role="menuitem"]')
      if (first) {
        focusFirst.current = false
        first.focus()
      } else {
        frame = requestAnimationFrame(focus)
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  // The row's own link opens the document in the next pane; these open it there too, with the
  // document group inventory beside it.
  const documentWithInventory = useCallback(
    (paneParams?: Record<string, string>) => ({
      panes: [
        ...routerPanesState.slice(0, groupIndex + 1),
        [{id: childId, params: {...paneParams, inspect: DOCUMENT_GROUP_INSPECTOR_NAME}}],
      ],
    }),
    [childId, groupIndex, routerPanesState],
  )

  const openInventory = useCallback(() => {
    close()
    returnFocus.current = null
    navigate(documentWithInventory())
  }, [close, documentWithInventory, navigate])

  // A pick also switches to the picked audience, in the same navigation, so the document opens in
  // the version the row stands for.
  const pick = useCallback(
    (variantId: string | null, paneParams?: Record<string, string>) => {
      close()
      returnFocus.current = null
      setVariant({
        variantId: isVariantId(variantId) ? variantId : undefined,
        state: documentWithInventory(paneParams),
      })
    },
    [close, documentWithInventory, setVariant],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const items = [
        ...(flyoutRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
      ]
      const at = items.indexOf(document.activeElement as HTMLElement)
      let next: HTMLElement | undefined
      switch (event.key) {
        case 'ArrowDown':
          next = items[(at + 1) % items.length]
          break
        case 'ArrowUp':
          next = items[(at - 1 + items.length) % items.length]
          break
        case 'Home':
          next = items[0]
          break
        case 'End':
          next = items[items.length - 1]
          break
        case 'ArrowLeft':
          event.preventDefault()
          event.stopPropagation()
          close()
          restoreFocus()
          return
        default:
          return
      }
      event.preventDefault()
      event.stopPropagation()
      next?.focus()
    },
    [close, restoreFocus],
  )

  // Like the row: a touch pointer leaves as the finger lifts, and that is not a reason to close
  const handleFlyoutPointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'touch') return
      closeSoon()
    },
    [closeSoon],
  )

  // The flyout is portalled but still inside the row's React tree: a click on it must not also
  // open the row's document.
  const stopRowClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => event.stopPropagation(),
    [],
  )

  return (
    <>
      <span aria-hidden hidden ref={setAnchor} />
      {children !== undefined && (
        // `display: contents` keeps the dots laid out as they were; the handlers see the taps
        // that bubble up from them
        <span
          onClick={handleDotsClick}
          onPointerUp={handleDotsPointerUp}
          ref={dotsRef}
          style={DOTS_STYLE}
        >
          {children}
        </span>
      )}
      {open && row && (
        <Popover
          arrow={false}
          content={
            <div
              onClick={stopRowClick}
              onKeyDown={handleKeyDown}
              onPointerEnter={keepOpen}
              onPointerLeave={handleFlyoutPointerLeave}
              ref={flyoutRef}
            >
              <RenderList onOpenInventory={openInventory} onPick={pick} renderList={renderList} />
            </div>
          }
          fallbackPlacements={['left-start', 'bottom-start', 'top-start']}
          floatingBoundary={document.body}
          open
          padding={0}
          placement="right-start"
          portal
          radius={3}
          referenceBoundary={document.body}
          referenceElement={row}
          shadow={0}
        />
      )}
    </>
  )
}

function RenderList(
  props: PaneItemVersionsFlyoutActions & {
    renderList: (actions: PaneItemVersionsFlyoutActions) => ReactNode
  },
) {
  const {renderList, ...actions} = props
  return renderList(actions)
}
