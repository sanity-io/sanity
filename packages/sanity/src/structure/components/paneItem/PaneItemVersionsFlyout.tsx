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

/**
 * The flyout of a document list row: the document's versions, opened by hovering anywhere on the
 * row (after a short delay), with ArrowRight on the focused row, or by a tap on the version dots
 * (`children`) on a touch screen, which has no hover. Picking a version opens the
 * document with the document group inventory open beside it.
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
  /** Renders the flyout's content. A pick or the inventory row opens the inventory. */
  renderList: (actions: {onOpenInventory: () => void; onPick: () => void}) => ReactNode
}) {
  const {childId, children, renderList} = props
  const {navigate} = useRouter()
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
      if (event.key !== 'ArrowRight' || event.target !== row) return
      event.preventDefault()
      event.stopPropagation()
      clearTimers()
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
    return () => {
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
      if (hadFocus) row?.focus()
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
  }, [close, open, row])

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

  const openInventory = useCallback(() => {
    close()
    navigate({
      panes: [
        ...routerPanesState.slice(0, groupIndex + 1),
        [{id: childId, params: {inspect: DOCUMENT_GROUP_INSPECTOR_NAME}}],
      ],
    })
  }, [childId, close, groupIndex, navigate, routerPanesState])

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
          row?.focus()
          return
        default:
          return
      }
      event.preventDefault()
      event.stopPropagation()
      next?.focus()
    },
    [close, row],
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
              <RenderList
                onOpenInventory={openInventory}
                onPick={openInventory}
                renderList={renderList}
              />
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

function RenderList(props: {
  onOpenInventory: () => void
  onPick: () => void
  renderList: (actions: {onOpenInventory: () => void; onPick: () => void}) => ReactNode
}) {
  const {renderList, ...actions} = props
  return renderList(actions)
}
