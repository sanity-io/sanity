// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit ef8bd9ec7f, lib/explorations/variants-2-0/mark/VersionMark.tsx).
// Changes from the original: imports point at this monorepo and ./types; nothing else, except where marked "LIVE:".
import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {Popover} from '../../../packages/sanity/src/ui-components/popover/Popover'

import {useCallback, useEffect, useId, useMemo, useRef, useState} from 'react'

import {type AudienceVersion, type State} from './types'
import {VersionsIcon} from './VersionsIcon'
import {insideTriangle, type Point} from './hoverIntent'
import {BadgeButton, BadgedControl, DotButton} from './StateBadge'
import {StateGlyph} from './StateGlyph'
import {VersionDescription} from './VersionDescription'
import {versionLines} from './versionLines'
import {
  POPOVER_AUDIENCES,
  type PopoverContent,
  type PopoverPattern,
  type PopoverWidth,
  VersionsPopover,
} from './VersionsPopover'

/**
 * The Option B icon: the state dot in the icon's own box. The disc or ring is 8px, centred, in the
 * 17px icon box of the 25px button (the glyph's own box is 25 units for a 7-unit disc).
 */
/** The icon box for an 8px disc: the disc is 7 of 25 units, so 25 * 8 / 7 px. */
const DOT_BOX = (25 * 8) / 7
const StateDotIcon = (dot: 'published' | 'draft' | null) =>
  function DotIcon() {
    return (
      <span style={{position: 'relative', display: 'block', width: 17, height: 17, flex: 'none'}}>
        <span
          data-state={dot ?? undefined}
          data-testid="state-dot-control"
          style={{
            position: 'absolute',
            left: (17 - DOT_BOX) / 2,
            top: (17 - DOT_BOX) / 2,
            display: 'flex',
            width: DOT_BOX,
            height: DOT_BOX,
          }}
        >
          {dot ? <StateGlyph size={DOT_BOX} state={dot} /> : null}
        </span>
      </span>
    )
  }

/** Milliseconds the pointer may spend between the button and the popover without closing it. */
const CLOSE_DELAY = 150
/** The gap of the floating patterns, in px. */
const PATTERN_GAP = 8
/** The offset Sanity UI's `Popover` adds between its reference and itself, in px. */
const POPOVER_OFFSET = 4
/** Hover intent: how long a pointer may rest inside the safe triangle before the popover closes. */
const STALL_DELAY = 250

const SHELL: Record<PopoverPattern, {radius: 0 | 1 | 2 | 3; shadow: 0 | 1 | 3}> = {
  pp1: {radius: 3, shadow: 3},
  pp2: {radius: 2, shadow: 1},
  pp3: {radius: 2, shadow: 0},
  pp4: {radius: 2, shadow: 0},
  pl1: {radius: 2, shadow: 0},
}

/**
 * What the button does on a selected or ticked row.
 * - `s1`: it stays and the popover works.
 * - `s2`: it dims and the popover is off.
 * - `s3`: it is hidden (its slot stays, so the dots keep their column).
 */
export type MarkBehaviour = 's1' | 's2' | 's3'

/**
 * What the trigger looks like (the selection and hover exploration).
 * - `icon`: the plain versions icon button (SP1, today).
 * - `pill`: ONE button holding the state glyph and the versions icon (SP2, SP3). The glyph is part
 *   of the button's label, not a second control.
 * - `badge`: the plain icon button with the state glyph as a badge on its top-right corner (SP4).
 * - `dot`: Option B. No icon: the state dot is the control, in the same 25px square slot and chrome.
 */
export type MarkTrigger = 'icon' | 'pill' | 'badge' | 'dot'
/** What a click on a pill in the popover (Option B) hands to the host. */
export type VersionPick = {
  docId: string
  audience: string | null
  state: State | 'more'
  release?: string
}

/**
 * `VersionInventory.Mini`: the versions button at the trailing edge of a list row, a plain library
 * icon in an icon button, no colour and no number. Hover or keyboard focus opens the popover on the
 * right; a click opens the pane (`onOpenPane`). The popover stays open while the pointer is on the
 * button or the popover, and for a short delay between them. Escape closes it and focus stays on
 * the button.
 */
export function VersionMark(props: {
  docId: string
  versions: readonly AudienceVersion[]
  onOpenPane: (docId: string) => void
  behaviour?: MarkBehaviour
  maxAudiences?: number
  popoverWidth?: PopoverWidth
  /** The shell option (default PP2, the pick of 2026-10-19). */
  pattern?: PopoverPattern
  /** Open at mount and stay open: for the pattern stories, which compare the shells. */
  forceOpen?: boolean
  trigger?: MarkTrigger
  /** What the popover body shows (default: today's pills). */
  content?: PopoverContent
  /** The base document's state, shown inside the `pill` and `badge` triggers. */
  dot?: 'published' | 'draft' | null
  /** `a` (default): flat labels in the popover. `b`: clickable chips. */
  option?: 'a' | 'b'
  /** Option B: a pill was clicked. Without it a pill click opens the inventory unscoped. */
  onOpenVersion?: (pick: VersionPick) => void
  /** PL1: the popover rows open the inventory for their audience. */
  rowsClickable?: boolean
  /**
   * How the popover decides to close once the pointer leaves the control. `timer`: a short delay.
   * `triangle`: it stays open while the pointer moves toward the popover (inside the triangle from
   * where it left to the popover's near edge). Default: `triangle` for PL1, `timer` otherwise.
   */
  hoverIntent?: 'timer' | 'triangle'
}) {
  const {docId, versions, onOpenPane, behaviour = 's1', maxAudiences = POPOVER_AUDIENCES} = props
  const [open, setOpen] = useState(false)
  const descId = useId()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const control = useRef<HTMLElement | null>(null)
  const popRef = useRef<HTMLDivElement | null>(null)
  // Set when focus returns to the control from the popover, so the focus does not reopen it.
  const skipOpen = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const cancelClose = useCallback(() => clearTimeout(timer.current), [])
  const show = useCallback(() => {
    cancelClose()
    stopTracking.current?.()
    stopTracking.current = null
    setOpen(true)
  }, [cancelClose])
  const focusControl = useCallback(() => {
    clearTimeout(timer.current)
    setOpen(false)
    skipOpen.current = true
    control.current?.querySelector('button')?.focus()
  }, [])
  const pattern = props.pattern ?? 'pp2'
  const intent = props.hoverIntent ?? (pattern === 'pl1' ? 'triangle' : 'timer')
  // Where the pointer last was over the control: the apex of the safe triangle.
  const lastPoint = useRef<Point | null>(null)
  const stopTracking = useRef<(() => void) | null>(null)
  const hideSoon = useCallback(() => {
    cancelClose()
    stopTracking.current?.()
    stopTracking.current = null
    if (intent === 'timer') {
      timer.current = setTimeout(() => setOpen(false), CLOSE_DELAY)
      return
    }
    // Hover intent: keep the popover open while the pointer travels toward it. The triangle runs from
    // the pointer to the two corners of the popover edge that faces the control. Each move inside it
    // re-arms a short stall timer, so a pointer that stops there still closes it. A move outside the
    // triangle or the popover closes it at once.
    const popover = popRef.current?.getBoundingClientRect()
    const box = control.current?.getBoundingClientRect()
    const from =
      lastPoint.current ?? (box && {x: box.left + box.width / 2, y: box.top + box.height / 2})
    if (!popover || !from) {
      timer.current = setTimeout(() => setOpen(false), CLOSE_DELAY)
      return
    }
    const near = popover.left >= from.x ? popover.left : popover.right
    const a: Point = {x: near, y: popover.top}
    const b: Point = {x: near, y: popover.bottom}
    const stall = () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        stopTracking.current?.()
        stopTracking.current = null
        setOpen(false)
      }, STALL_DELAY)
    }
    const move = (event: PointerEvent) => {
      const p = {x: event.clientX, y: event.clientY}
      const r = popRef.current?.getBoundingClientRect()
      const inPopover = !!r && p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom
      if (inPopover) {
        // The popover's own pointerenter takes over from here.
        clearTimeout(timer.current)
        stopTracking.current?.()
        stopTracking.current = null
      } else if (insideTriangle(p, from, a, b)) {
        stall()
      } else {
        clearTimeout(timer.current)
        stopTracking.current?.()
        stopTracking.current = null
        setOpen(false)
      }
    }
    document.addEventListener('pointermove', move)
    stopTracking.current = () => document.removeEventListener('pointermove', move)
    stall()
  }, [cancelClose, intent])
  useEffect(
    () => () => {
      cancelClose()
      stopTracking.current?.()
    },
    [cancelClose],
  )

  // The popover opens beside the list pane, not over it: the reference is the pane's right edge at
  // the button's height, so the pane's border is never crossed by the popover.
  const shown = open || !!props.forceOpen
  const reference = useMemo(() => {
    if (!shown || !anchor) return null
    const pane = anchor.closest('[data-testid="document-list"]')
    const button = anchor.getBoundingClientRect()
    if (!pane) return anchor
    const edge = pane.getBoundingClientRect().right
    // PP2 (the default) floats 8px from the pane and aligns with the hovered row; PP3 is flush and
    // aligns with the row too; PP1 and PP4 float and align with the button. The popover adds its own offset, which `POPOVER_OFFSET` takes out.
    const row = anchor.closest('[data-testid^="list-row-"]')?.getBoundingClientRect()
    const flush = pattern === 'pp3' || pattern === 'pl1'
    // PL1: the first popover row (8px padding and a 1px border in) lines up with the hovered row.
    const top = pattern === 'pl1' && row ? row.top - 9 : row?.top
    const rect =
      (flush || pattern === 'pp2') && row
        ? new DOMRect(
            (flush ? edge - 1 : edge + PATTERN_GAP) - POPOVER_OFFSET,
            top ?? row.top,
            0,
            row.height,
          )
        : new DOMRect(edge + PATTERN_GAP - POPOVER_OFFSET, button.top, 0, button.height)
    return {getBoundingClientRect: () => rect, contextElement: anchor} as unknown as HTMLElement
  }, [shown, anchor, pattern])

  if (behaviour === 's3') return null
  const live = behaviour === 's1'
  // Option A (v1): the popover only shows. Option B and PL1 have controls in it.
  const readOnly = props.option !== 'b' && pattern !== 'pl1'
  const summary = readOnly ? versionLines(versions, {max: maxAudiences}) : null

  return (
    <>
      <div
        onBlur={live ? hideSoon : undefined}
        onFocus={
          live
            ? () => {
                if (skipOpen.current) {
                  skipOpen.current = false
                  return
                }
                show()
              }
            : undefined
        }
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            cancelClose()
            setOpen(false)
          }
          // Tab from the control enters the popover (it is portalled, so it is not next in the DOM).
          if (event.key === 'Tab' && !event.shiftKey && shown) {
            const first = popRef.current?.querySelector<HTMLElement>('button:not([disabled])')
            if (first) {
              event.preventDefault()
              first.focus()
            }
          }
        }}
        onPointerEnter={live ? show : undefined}
        onPointerLeave={live ? hideSoon : undefined}
        onPointerMove={(event) => {
          lastPoint.current = {x: event.clientX, y: event.clientY}
        }}
        ref={(el) => {
          control.current = el
          setAnchor(el)
        }}
      >
        {(() => {
          const trigger = props.trigger ?? 'icon'
          const dot = props.dot ?? null
          // One accessible name for the one control, with the base document's state in it.
          const name =
            `${versions.length} ${versions.length === 1 ? 'version' : 'versions'}` +
            (trigger !== 'icon' && dot ? `. The base document is ${dot}` : '') +
            '. Open the document and its version inventory'
          const onClick = () => {
            setOpen(false)
            onOpenPane(docId)
          }
          if (trigger === 'dot') {
            // Option B: the dot is the control. A 25px square, the dot (8px) centred in it.
            return (
              <DotButton
                aria-describedby={summary ? descId : undefined}
                aria-expanded={shown}
                aria-label={name}
                data-testid={`version-mark-${docId}`}
                disabled={!live}
                icon={StateDotIcon(dot)}
                style={{width: 25, height: 25, padding: 0}}
                mode="bleed"
                onClick={onClick}
                tooltipProps={null}
              />
            )
          }
          if (trigger === 'badge') {
            // SP4: the state dot is a badge on the corner of the icon button. It is a sibling of
            // the button that ignores the pointer, so the control stays one hit area, and its halo
            // follows the button's fill (read from the button on hover).
            return (
              <BadgedControl dot={dot}>
                <BadgeButton
                  aria-describedby={summary ? descId : undefined}
                  aria-label={name}
                  data-testid={`version-mark-${docId}`}
                  disabled={!live}
                  icon={VersionsIcon}
                  mode="bleed"
                  onClick={onClick}
                  tooltipProps={null}
                />
              </BadgedControl>
            )
          }
          return (
            <Button
              aria-describedby={summary ? descId : undefined}
              aria-label={name}
              data-testid={`version-mark-${docId}`}
              disabled={!live}
              style={{cursor: live ? 'pointer' : 'default'}}
              icon={trigger === 'pill' && dot ? <StateGlyph gap={2} state={dot} /> : VersionsIcon}
              iconRight={trigger === 'pill' ? VersionsIcon : undefined}
              mode="bleed"
              onClick={onClick}
              tooltipProps={null}
            />
          )
        })()}
        {summary ? (
          // The popover as text, for the control's accessible description (the popover itself is
          // hidden from assistive technology so it is not read twice).
          <VersionDescription id={descId} lines={summary.lines} more={summary.more} />
        ) : null}
      </div>
      {live && shown && reference ? (
        <Popover
          arrow={false}
          content={
            <div
              aria-hidden={readOnly || undefined}
              onBlur={hideSoon}
              onFocus={show}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.stopPropagation()
                  focusControl()
                  return
                }
                if (event.key !== 'Tab') return
                const items = [
                  ...(popRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])') ??
                    []),
                ]
                const at = items.indexOf(document.activeElement as HTMLElement)
                // Past either end, focus goes back to the control and the popover closes.
                if ((event.shiftKey && at <= 0) || (!event.shiftKey && at === items.length - 1)) {
                  event.preventDefault()
                  focusControl()
                }
              }}
              onPointerEnter={show}
              onPointerLeave={hideSoon}
              ref={popRef}
            >
              <VersionsPopover
                onOpenInventory={() => {
                  setOpen(false)
                  onOpenPane(docId)
                }}
                onPick={
                  props.option === 'b' || pattern === 'pl1'
                    ? (pick) => {
                        setOpen(false)
                        if (props.onOpenVersion) props.onOpenVersion({docId, ...pick})
                        else onOpenPane(docId)
                      }
                    : undefined
                }
                option={props.option}
                readOnly={readOnly}
                rowsClickable={props.rowsClickable}
                maxAudiences={maxAudiences}
                content={props.content}
                pattern={pattern}
                width={props.popoverWidth}
                testId={`version-popover-${docId}`}
                versions={versions}
              />
            </div>
          }
          fallbackPlacements={['left-start', 'bottom-start', 'top-start']}
          open
          padding={0}
          placement="right-start"
          radius={SHELL[pattern].radius}
          referenceElement={reference}
          shadow={SHELL[pattern].shadow}
          style={
            pattern === 'pp3' || pattern === 'pl1'
              ? {borderTopLeftRadius: 0, borderBottomLeftRadius: 0, overflow: 'hidden'}
              : undefined
          }
        />
      ) : null}
    </>
  )
}
