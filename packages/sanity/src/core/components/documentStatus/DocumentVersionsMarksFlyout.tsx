import {PortalProvider} from '@sanity/ui'
import {
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {useRouter} from 'sanity/router'

import {Popover} from '../../../ui-components/popover/Popover'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {usePerspective} from '../../perspective/usePerspective'
import {useSetVariant} from '../../perspective/useSetVariant'
import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {type DocumentPresence} from '../../store/presence/types'
import {isVariantId} from '../../variants/types'
import {DocumentVersionsFlyoutList} from './DocumentVersionsFlyoutList'
import {getDocumentGroupIntentParams} from './getDocumentGroupIntentParams'
import {
  type FlyoutRect,
  getMarksFlyoutAnchor,
  getMarksFlyoutSide,
  type MarksFlyoutSide,
} from './getMarksFlyoutPlacement'
import {insideTriangle, type Point} from './insideTriangle'

/** How long the pointer rests on the marks before the flyout opens, as on a document list row. */
const OPEN_DELAY = 300
/** How long the flyout stays open after the pointer left the marks and the flyout. */
const CLOSE_DELAY = 150
/** How long the pointer may rest inside the safe triangle on its way to the flyout. */
const STALL_DELAY = 250

/**
 * Where a surface's rows sit: the box the flyout opens beside and never over, and the row whose
 * top the flyout lines up with. Both are found from the marks with `closest()`.
 *
 * @internal
 */
export interface MarksFlyoutSurface {
  /** Selector of the box around the rows: the flyout opens to its right, else to its left. */
  container: string
  /** Selector of the row the marks are on. */
  row: string
}

/**
 * Search results: beside the search dialog (`SearchPopover`, `SearchDialog`), top aligned with
 * the result row. A full-screen search leaves no room on either side, so nothing opens there.
 *
 * @internal
 */
export const SEARCH_RESULT_MARKS_SURFACE: MarksFlyoutSurface = {
  container: '[data-search-dialog]',
  row: '[data-search-result-row]',
}

/**
 * Reference previews in a form: beside the field the reference is in, top aligned with the
 * reference item, so it never covers the next item or the next field.
 *
 * @internal
 */
export const REFERENCE_MARKS_SURFACE: MarksFlyoutSurface = {
  container: '[data-testid^="field-"]',
  row: '[data-ui="ReferenceLinkCard"]',
}

/** The flyout that is open, across every row: opening one closes the one before. */
let openFlyout: {close: () => void} | null = null

interface OpenState {
  side: MarksFlyoutSide
  /** What the Popover is placed against: a line at the box's edge, at the row's height. */
  reference: HTMLElement
}

/**
 * The versions flyout on the status marks of a search result or a reference preview: the same
 * content as on a document list row (`DocumentVersionsFlyoutList`), opened by resting the pointer
 * on the marks (only on them: the rest of the row opens nothing), and placed beside the box the
 * rows are in (`surface`), outside it, so it never covers another row or field. When neither side
 * of the box has room it does not open. A pick, or the footer row, opens the document with the
 * document group inventory beside it, then `onNavigate` runs (search closes its dialog there).
 *
 * There is no keyboard way in: in search the input owns the arrow keys, and a reference preview
 * keeps its own keys. The marks carry an accessible summary (the number of versions).
 *
 * @internal
 */
export function DocumentVersionsMarksFlyout(props: {
  /** The status marks of the row. */
  children: ReactNode
  /** The published id of the document. */
  documentId: string
  documentType: string
  /** Who is editing the document: their avatars sit on the flyout's audience rows. */
  presence?: DocumentPresence[]
  surface: MarksFlyoutSurface
  /** How many versions the document has, for the marks' accessible summary. */
  versionCount: number
  /** Runs after a pick or the footer row navigated to the document. */
  onNavigate?: () => void
}) {
  const {children, documentId, documentType, onNavigate, presence, surface, versionCount} = props
  const {t} = useTranslation()
  const marksRef = useRef<HTMLSpanElement | null>(null)
  const flyoutRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState<OpenState | null>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastPoint = useRef<Point | null>(null)
  const stopTracking = useRef<(() => void) | null>(null)

  const clearTimers = useCallback(() => {
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
    stopTracking.current?.()
    stopTracking.current = null
  }, [])

  const close = useCallback(() => {
    clearTimers()
    setOpen(null)
  }, [clearTimers])

  const keepOpen = useCallback(() => {
    clearTimeout(closeTimer.current)
    stopTracking.current?.()
    stopTracking.current = null
  }, [])

  // Opens beside the surface's box when one side has room; otherwise stays closed.
  const openBeside = useCallback(() => {
    const marks = marksRef.current
    const container = marks?.closest<HTMLElement>(surface.container)
    if (!marks || !container) return
    const box = container.getBoundingClientRect()
    const side = getMarksFlyoutSide({
      container: box,
      viewportWidth: document.documentElement.clientWidth,
    })
    if (!side) return
    const row: FlyoutRect = (
      marks.closest<HTMLElement>(surface.row) ?? marks
    ).getBoundingClientRect()
    const anchor = getMarksFlyoutAnchor({container: box, row, side})
    // A virtual reference: floating-ui only reads its box (and its context element, for the
    // scroll parents to listen to)
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the Popover types its reference as an element, and floating-ui takes a virtual one
    const reference = {
      contextElement: marks,
      getBoundingClientRect: () => anchor,
    } as unknown as HTMLElement
    setOpen({side, reference})
  }, [surface])

  // The pointer left the marks or the flyout: close after a short delay, unless it is travelling
  // toward the flyout, which the safe triangle allows for.
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
        // The flyout's own pointerenter takes over from here
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

  const handleMarksEnter = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      if (event.pointerType === 'touch') return
      lastPoint.current = {x: event.clientX, y: event.clientY}
      keepOpen()
      clearTimeout(openTimer.current)
      openTimer.current = setTimeout(openBeside, OPEN_DELAY)
    },
    [keepOpen, openBeside],
  )
  const handleMarksMove = useCallback((event: ReactPointerEvent<HTMLSpanElement>) => {
    lastPoint.current = {x: event.clientX, y: event.clientY}
  }, [])
  const handleLeave = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === 'touch') return
      closeSoon()
    },
    [closeSoon],
  )

  useEffect(() => clearTimers, [clearTimers])

  // Only one flyout is open at a time
  useEffect(() => {
    if (!open) return undefined
    const self = {close}
    if (openFlyout && openFlyout !== self) openFlyout.close()
    openFlyout = self
    return () => {
      if (openFlyout === self) openFlyout = null
    }
  }, [close, open])

  // Escape closes the flyout only (not the search dialog around it), and so does scrolling, which
  // would leave it beside a row that moved.
  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      close()
    }
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('scroll', close, true)
    }
  }, [close, open])

  // The flyout is portalled but still inside the row's React tree: a click on it must not also
  // follow the row's link
  const stopRowClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
  }, [])

  return (
    <>
      <span
        aria-label={t('document-group.marks.label', {count: versionCount})}
        data-testid="document-versions-marks"
        onPointerEnter={handleMarksEnter}
        onPointerLeave={handleLeave}
        onPointerMove={handleMarksMove}
        ref={marksRef}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- an inline cluster of icons inside a preview row; a fieldset would break the row's layout
        role="group"
        style={{display: 'inline-flex', alignItems: 'center'}}
      >
        {children}
      </span>
      {open && (
        // Out of any pane or dialog that would clip it
        <PortalProvider element={document.body}>
          <Popover
            animate={false}
            arrow={false}
            content={
              // oxlint-disable-next-line jsx-a11y/click-events-have-key-events -- only stops the row's link from also handling clicks on the menu items, which are buttons
              <div
                data-side={open.side}
                data-testid="document-versions-marks-flyout"
                onClick={stopRowClick}
                onPointerEnter={keepOpen}
                onPointerLeave={handleLeave}
                ref={flyoutRef}
              >
                <FlyoutContent
                  documentId={documentId}
                  documentType={documentType}
                  onClose={close}
                  onNavigate={onNavigate}
                  presence={presence}
                />
              </div>
            }
            // The side is decided before opening, from the room beside the box. No fallback
            // placements: `flip` (which runs before `shift`, and checks the cross axis too) has
            // nothing to flip to, so it can never move the flyout above or below over the rows;
            // `shift` only slides it along the box's edge to stay in the viewport.
            fallbackPlacements={[]}
            floatingBoundary={document.body}
            open
            padding={0}
            placement={open.side === 'right' ? 'right-start' : 'left-start'}
            portal
            radius={3}
            referenceBoundary={document.body}
            referenceElement={open.reference}
            shadow={0}
          />
        </PortalProvider>
      )}
    </>
  )
}

/** The flyout's content and its navigation, mounted only while it is open. */
function FlyoutContent(props: {
  documentId: string
  documentType: string
  onClose: () => void
  onNavigate?: () => void
  presence?: DocumentPresence[]
}) {
  const {documentId, documentType, onClose, onNavigate, presence} = props
  const router = useRouter()
  const setVariant = useSetVariant()
  const {selectedPerspective} = usePerspective()
  const {versions} = useDocumentVersions({documentId})

  const openInventory = useCallback(() => {
    onClose()
    router.navigateIntent(
      'edit',
      getDocumentGroupIntentParams({id: documentId, type: documentType}),
    )
    onNavigate?.()
  }, [documentId, documentType, onClose, onNavigate, router])

  // A pick also switches to the picked audience, in the same navigation, so the document opens in
  // the version the row stands for
  const pick = useCallback(
    (variantId: string | null) => {
      onClose()
      setVariant({
        variantId: isVariantId(variantId) ? variantId : undefined,
        state: {
          intent: 'edit',
          params: getDocumentGroupIntentParams({
            id: documentId,
            type: documentType,
            variantId,
            selectedPerspective,
            versions,
          }),
        },
      })
      onNavigate?.()
    },
    [documentId, documentType, onClose, onNavigate, selectedPerspective, setVariant, versions],
  )

  return (
    <DocumentVersionsFlyoutList
      documentGroupId={documentId}
      onOpenInventory={openInventory}
      onPick={pick}
      presence={presence}
    />
  )
}
