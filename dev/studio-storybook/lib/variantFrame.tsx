import {Badge, type BadgeTone} from '@sanity/ui'
import {type Decorator} from '@storybook/react-vite'
import {type ReactNode, useLayoutEffect, useRef, useState} from 'react'
import styled, {css} from 'styled-components'

import {type Lane, resolveLane} from './lanes'

/**
 * The four-lane provenance marker, rendered in the story canvas and on autodocs pages.
 * One marker per story; normal/unclassified stories are left untouched.
 *
 *   Lane 1 UI v3      → NO canvas marker — canon @sanity/ui primitive (sidebar glyph only).
 *   Lane 2 Studio     → NO canvas marker — canon Studio component (sidebar glyph only).
 *   Lane 3 Proposed   → green dashed frame + "Proposed — not shipped" — our audit fix.
 *   Lane 4 Envisioned → amber dotted frame + "Envisioned — not built" — future direction.
 *   Lane 5 Stubbed    → blue double frame + "Stubbed — shipped, fabricated data" — a real
 *                       component reached through a fabricated source. The frame says the
 *                       component is real and the data is not, which is the exact mistake a
 *                       viewer would otherwise make in either direction.
 *   · Current         → red solid frame + "As shipped — audit finding" — the paired defect.
 *
 * The canon lanes (UI v3 / Studio) deliberately draw NOTHING on the canvas: a chip stamped on
 * every primitive obscured the component it annotated (violating the zero-footprint law). Only
 * the three framed lanes get a ring + a badge, and the badge flows as a caption ABOVE the frame
 * (never overlapping the component, never clipped by the canvas edge).
 *
 * ZERO-FOOTPRINT: the story's own layout is byte-identical with and without the marker.
 * The host is a plain full-width block and the story renders through a `display: contents`
 * wrapper, so it lays out exactly as if the decorator were absent — no flex / inline-block /
 * width effects on the component. The frame and badge are `position: absolute` overlays
 * (pointer-events: none) sized to the content's MEASURED ink box, so the ring hugs the real
 * component instead of stretching to the full canvas. (An earlier version drew the ring on
 * the wrapper, which spanned the whole canvas beside a narrow component; CSS shrink-wrap —
 * fit-content — was rejected because it collapses width:100% inputs, e.g. StringInput.)
 *
 * Derivation lives in lib/lanes.ts. Contract: docs/workspace/storybook-briefs/
 * studio-storybook-organization.md §3–4.
 */

const FRAMED_LANES: readonly Lane[] = ['proposed', 'current', 'envisioned', 'stubbed']

const LABELS: Record<Lane, string> = {
  uiv3: 'UI v3',
  studio: 'Studio',
  proposed: 'Proposed — not shipped',
  current: 'As shipped — audit finding',
  envisioned: 'Envisioned — not built',
  stubbed: 'Stubbed — shipped, fabricated data',
}

const TONES: Record<Lane, BadgeTone> = {
  uiv3: 'primary',
  studio: 'default',
  proposed: 'positive',
  current: 'critical',
  envisioned: 'caution',
  stubbed: 'primary',
}

type FramedLane = 'proposed' | 'current' | 'envisioned' | 'stubbed'
type FrameStyle = 'dashed' | 'solid' | 'dotted' | 'double'

const BORDER: Record<FramedLane, FrameStyle> = {
  proposed: 'dashed', // a suggestion
  current: 'solid', // a hard as-shipped edge
  envisioned: 'dotted', // tentative, not built
  // Two lines, because the story is two claims at once: the component is real (a solid edge)
  // and what fills it is not (a second edge standing off it).
  stubbed: 'double',
}

// `border-style: double` needs at least 3px of width to resolve into two visible lines; at the
// 2px the other lanes use it renders identical to `solid`, which would make Stubbed and
// Current indistinguishable at a glance.
const WIDTH: Record<FramedLane, number> = {
  proposed: 2,
  current: 2,
  envisioned: 2,
  stubbed: 4,
}

// Tone → the theme's solid edge color, with a fallback so a missing theme never blanks a
// story (a global decorator must not throw). Hues match the Badge tones above.
const EDGE_TONE: Record<FramedLane, 'positive' | 'critical' | 'caution' | 'primary'> = {
  proposed: 'positive',
  current: 'critical',
  envisioned: 'caution',
  stubbed: 'primary',
}
const FALLBACK_EDGE: Record<'positive' | 'critical' | 'caution' | 'primary', string> = {
  positive: '#43d675',
  critical: '#f03e2f',
  caution: '#f5a623',
  primary: '#2276fc',
}

interface InkBox {
  left: number
  top: number
  width: number
  height: number
}

/**
 * The content's visible ink box, relative to `host`. Union of the story's leaf elements plus
 * any element with a visible background or border (the component's own card / field), skipping
 * zero-size / hidden nodes. This is what the ring hugs, so a full-width component measures
 * full-width and a 640px card measures 640px.
 *
 * We skip only `position: fixed` (viewport-anchored floating chrome). `position: absolute` is
 * KEPT: React portals (tooltips / popovers) render OUTSIDE this content subtree, so
 * `content.querySelectorAll` never returns them, which means any absolute element it does find
 * is genuinely part of the story's composition (e.g. a mask overlay with inset: 0). Skipping
 * absolute under-sized such stories, so the frame cut through them.
 */
function measureInkBox(host: HTMLElement, content: HTMLElement): InkBox | null {
  const hostRect = host.getBoundingClientRect()
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  let found = false

  for (const el of content.querySelectorAll<HTMLElement>('*')) {
    const cs = getComputedStyle(el)
    if (cs.position === 'fixed') continue
    if (cs.visibility === 'hidden' || cs.display === 'none') continue
    if (el.children.length > 0 && !hasVisibleBox(cs)) continue

    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue

    left = Math.min(left, r.left)
    top = Math.min(top, r.top)
    right = Math.max(right, r.right)
    bottom = Math.max(bottom, r.bottom)
    found = true
  }

  if (!found) return null
  return {
    left: left - hostRect.left,
    top: top - hostRect.top,
    width: right - left,
    height: bottom - top,
  }
}

function hasVisibleBox(cs: CSSStyleDeclaration): boolean {
  const bg = cs.backgroundColor
  const hasBg = Boolean(bg) && bg !== 'transparent' && !/,\s*0\)$/.test(bg)
  const hasBorder =
    parseFloat(cs.borderTopWidth) > 0 ||
    parseFloat(cs.borderRightWidth) > 0 ||
    parseFloat(cs.borderBottomWidth) > 0 ||
    parseFloat(cs.borderLeftWidth) > 0
  return hasBg || hasBorder
}

// Full-width block: the story lays out exactly as without the decorator.
const Host = styled.div`
  position: relative;
  display: block;
`

// `display: contents` removes this wrapper from layout entirely — the story's own roots
// participate in Host's flow as if this element were not here. Its box is not drawn; it only
// gives the effect a DOM node to read the rendered content from.
const ContentSlot = styled.div`
  display: contents;
`

// The ring is drawn OUTSET from the measured ink box by RING_PAD on every side, so its border
// never sits over the content's own edge pixels. Hugging the box exactly clipped the first
// letter of any caption / control that was flush at the box edge (the whole "Recommended" and
// "Envisioned" comparison-story family put a label at 0,0 of the ink box).
const RING_PAD = 8

const Ring = styled.div<{$lane: FramedLane}>`
  position: absolute;
  box-sizing: border-box;
  border-radius: 8px;
  pointer-events: none;
  z-index: 90;

  ${({$lane, theme}) => {
    const tone = EDGE_TONE[$lane]
    const edge = theme?.sanity?.color?.solid?.[tone]?.enabled?.bg ?? FALLBACK_EDGE[tone]
    return css`
      border: ${WIDTH[$lane]}px ${BORDER[$lane]} ${edge};
    `
  }}
`

// The badge is a CAPTION for the framed region, not chrome on the component. It flows as a
// real block ABOVE the frame (not absolutely positioned), so it reads as a label for the block
// rather than part of the component (which corner badges, aligned with the component's own
// header avatars/menus, did) AND can never be clipped by the canvas top edge (an absolute
// caption was, when the frame sat at y=0 in isolated story view). Only framed lanes draw it;
// canon lanes (UI v3 / Studio) carry no canvas marker — provenance is the sidebar glyph + docs.
const BadgeCaption = styled.div`
  display: flex;
  margin-bottom: 16px;
`

/**
 * Global decorator: marks a story with its provenance lane; no-ops on unclassified stories.
 * Sits inside `withSanityTheme` so the frame + Badge tones track the light / dark toggle.
 */
export const withVariantFrame: Decorator = (Story, context) => {
  const lane = resolveLane({id: context.id, tags: context.tags})
  // Embed opt-out: when a host embeds our stories as figures (the magazine captions
  // Current/Recommended its own way), the catalog chrome would double-frame. A host
  // adds `?sanityCatalogChrome=off` to the iframe URL to stand the visual layer down.
  // resolveLane still runs above — only the frame/badge/chip is suppressed; the story
  // renders byte-identical to an unmarked story.
  // Canon lanes (UI v3 / Studio) and unclassified stories draw no canvas marker, so they skip
  // the measuring wrapper entirely — the story renders exactly as it would undecorated.
  if (!lane || !FRAMED_LANES.includes(lane) || chromeSuppressed()) return <Story />
  return (
    <LaneMarker lane={lane}>
      <Story />
    </LaneMarker>
  )
}

/** True when the embedding host opts out of catalog chrome via `?sanityCatalogChrome=off`. */
function chromeSuppressed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return new URLSearchParams(window.location.search).get('sanityCatalogChrome') === 'off'
  } catch {
    return false
  }
}

function LaneMarker({lane, children}: {lane: Lane; children: ReactNode}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<InkBox | null>(null)

  useLayoutEffect(() => {
    const host = hostRef.current
    const content = contentRef.current
    if (!host || !content) return undefined

    let frame = 0
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setBox(measureInkBox(host, content))
      })
    }

    schedule()
    const observer = new ResizeObserver(schedule)
    observer.observe(host)
    observer.observe(content)
    window.addEventListener('resize', schedule)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [children])

  const framed = FRAMED_LANES.includes(lane)

  return (
    <Host ref={hostRef} data-lane={lane}>
      {framed ? (
        <BadgeCaption>
          <Badge tone={TONES[lane]} fontSize={0} padding={2} radius={2}>
            {LABELS[lane]}
          </Badge>
        </BadgeCaption>
      ) : null}
      <ContentSlot ref={contentRef}>{children}</ContentSlot>
      {box && framed ? (
        <Ring
          $lane={lane as FramedLane}
          style={{
            left: box.left - RING_PAD,
            top: box.top - RING_PAD,
            width: box.width + RING_PAD * 2,
            height: box.height + RING_PAD * 2,
          }}
        />
      ) : null}
    </Host>
  )
}
