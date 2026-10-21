import {DocumentsIcon} from '@sanity/icons/Documents'
import {Box, Button, Flex, Text} from '@sanity/ui'
import {type CSSProperties, useState} from 'react'
import {createPortal} from 'react-dom'
import {ReleaseAvatarIcon} from 'sanity'

import {RhombusIcon} from '../../../packages/sanity/src/core/components/temporary-icons/Rhombus'
import {Chip} from '../../../packages/sanity/src/core/releases/components/Chip'
import {useVariantDefinitions} from '../c1/world'
import {useCorpus} from '../c5/useCorpus'
import {useVersionList} from '../data/useVersionList'
import {CubeIcon} from './Cube'
import {lastPanel, useInspectorPanels} from './inspectorPanels'
import {useCircleRegistry, useLocalBar} from './localBar'
import {Pick} from './Pick'
import {LOCAL_OUTLINE, stateToneOf} from './stateTone'
import {layerLabel, usePaneAddress} from './usePaneAddress'

// Open beta, the document header (Figma C2 "Document header · selected for open beta", section 561:35886; token frame 564:19198; spec
// docs/initiatives/curation-perspective-selector/OPEN-BETA-HEADER-SPEC.md):
//   - the perspective circle (P1 to P4) at the left of the header: a cube that says whose set the pane shows (muted outline = follows global, purple
//     outline = its own), pressed with a caret while the bar is open;
//   - "<title> · N versions" (H4) beside it: the one way into the inspector;
//   - the bar under the header (B1 to B3): the state, "•", the variant, "Follow global perspective".
// The footer's "Manage versions" is replaced by the pill, so it is hidden here (a stock core button behind a core flag, no seam for it).

const NONE = 'none'
const PRESSED = 'var(--card-badge-default-bg-color)'
const WHITE_CHIP: CSSProperties = {background: 'var(--card-bg-color)', border: 0, boxShadow: 'none'}
const LOCAL_COLOR = 'var(--card-badge-suggest-icon-color)'
const CIRCLE = 29

const shortId = (id: string) => id.replace(/^_\.variants\./, '')

/**
 * P4: the caret under the circle, 18 x 9, the bar's fill, a 1 px border on its two upper edges, opening into the bar. The header clips what hangs
 * below its controls and sits above the content, so the caret is drawn from the bar, in the page layer, at the circle's centre.
 */
function Caret({bar}: {bar: HTMLElement | null}) {
  const registry = useCircleRegistry()
  const [spot, setSpot] = useState<{left: number; top: number; fill: string; line: string} | null>(
    null,
  )
  const measure = () => {
    const circle = registry.find()
    if (!circle || !bar) return setSpot(null)
    const c = circle.getBoundingClientRect()
    const b = bar.getBoundingClientRect()
    // Outside the theme the colour variables do not resolve, so the caret takes their values from the circle, which is inside it.
    const theme = getComputedStyle(circle)
    setSpot({
      left: c.left + c.width / 2 - 9,
      top: b.top - 10,
      fill: theme.getPropertyValue('--card-bg-color').trim(),
      line: theme.getPropertyValue('--card-border-color').trim(),
    })
  }
  const watch = (el: Element | null) => {
    if (!el) return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    if (bar) observer.observe(bar)
    const circle = registry.find()
    if (circle) observer.observe(circle)
    window.addEventListener('resize', measure)
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }
  return createPortal(
    <svg
      aria-hidden="true"
      data-testid="local-bar-caret"
      height="10"
      ref={(el) => watch(el)}
      style={{
        left: spot?.left ?? -100,
        pointerEvents: 'none',
        position: 'fixed',
        top: spot?.top ?? -100,
        visibility: spot ? 'visible' : 'hidden',
        zIndex: 300,
      }}
      viewBox="0 0 18 10"
      width="18"
    >
      <path d="M0 9.5 9 .5l9 9" fill={spot?.fill} stroke={spot?.line} />
      <rect fill={spot?.fill} height="2" width="16" x="1" y="8.5" />
    </svg>,
    document.body,
  )
}

/** The pane's address: its own when it holds one, else the global one. `local` is true only while it differs from the global perspective. */
function usePaneState() {
  const {held, local, global, differs, set} = usePaneAddress()
  return {shown: held ? local : global, local: differs, set, global}
}

/** H1 and H4: the perspective circle, then "<title> · N versions". */
export function LocalPerspectiveHeader({documentId}: {documentId: string}) {
  const {local, shown} = usePaneState()
  const versions = useVersionList(documentId)
  const corpus = useCorpus()
  const [barOpen, setBarOpen] = useLocalBar()
  const registry = useCircleRegistry()
  const {panels, activeId, close} = useInspectorPanels()
  // H4: the pill is pressed while any panel is open; a click closes it, or opens the panel last used (Versions the first time).
  const inventoryOpen = activeId !== undefined
  const count = versions?.length ?? 0
  const title = corpus?.docs.find((d) => d.id === documentId)?.title ?? documentId
  const circleStyle: CSSProperties = {
    alignItems: 'center',
    background: barOpen ? PRESSED : 'transparent',
    border: 0,
    borderRadius: '50%',
    color: 'var(--card-fg-color)',
    cursor: 'pointer',
    display: 'inline-flex',
    flex: 'none',
    height: CIRCLE,
    justifyContent: 'center',
    padding: 0,
    width: CIRCLE,
  }
  return (
    <Flex align="center" data-testid="doc-pills-c" gap={2} style={{flex: '0 0 auto', minWidth: 0}}>
      <style>{`
        [data-testid="action-document-group-inventory"] {display: none !important}
        [data-testid="perspective-circle"]:hover {background: ${PRESSED} !important}
      `}</style>
      <span style={{display: 'inline-flex', flex: 'none'}}>
        <button
          aria-label={
            local
              ? 'This document has its own perspective'
              : 'This document follows the global perspective'
          }
          aria-pressed={barOpen}
          data-local={local ? '' : undefined}
          data-testid="perspective-circle"
          ref={(el) => registry.register(el)}
          onClick={() => setBarOpen(!barOpen)}
          style={circleStyle}
          title={
            local
              ? 'This document has its own perspective. Click to edit it, or to follow the global one.'
              : "Follows the global perspective. Click to set this document's own."
          }
          type="button"
        >
          <CubeIcon filled={local} tone={stateToneOf(shown.perspective)} />
        </button>
      </span>
      <Chip
        data-testid="header-versions"
        icon={DocumentsIcon}
        mode="ghost"
        onClick={() =>
          inventoryOpen
            ? close()
            : (panels.find((p) => p.id === lastPanel()) ?? panels[0])?.select()
        }
        style={{
          ...(inventoryOpen ? {background: PRESSED} : null),
          height: CIRCLE,
          maxWidth: 360,
          paddingLeft: 12,
          paddingRight: 14,
        }}
        text={`${title} · ${count} ${count === 1 ? 'version' : 'versions'}`}
      />
    </Flex>
  )
}

/** B1 to B3: the bar under the header, while it is open. */
export function LocalPerspectiveRow({documentId}: {documentId: string}) {
  const {shown, set, local} = usePaneState()
  const definitions = useVariantDefinitions()
  const versions = useVersionList(documentId)
  const [open, setOpen] = useLocalBar()
  const [barElement, setBarElement] = useState<HTMLElement | null>(null)
  if (!open) return null

  const titleOf = (id: string) =>
    definitions.find((d) => shortId(d._id) === id)?.metadata?.title ?? id
  const releases = [
    ...new Map(
      (versions ?? [])
        .filter(
          (v) =>
            v.bundleId && v.bundleId !== 'drafts' && v.bundleId !== 'published' && !v.variantId,
        )
        .map((v) => [v.bundleId as string, v.release ?? (v.bundleId as string)]),
    ).entries(),
  ]
  const layers = [
    {key: 'published', text: 'Published'},
    {key: 'drafts', text: 'Drafts'},
    ...releases.map(([id, title]) => ({key: id, text: title})),
  ]
  const singles = definitions.filter((d) => Object.keys(d.conditions).length === 1)
  const layerText =
    layers.find((l) => l.key === shown.perspective)?.text ?? layerLabel(shown.perspective)

  return (
    <div ref={setBarElement}>
      <Caret bar={barElement} />
      <Flex
        align="center"
        data-testid="local-perspective-row"
        justify="space-between"
        style={{
          background: 'var(--card-bg-color)',
          borderBottom: '1px solid var(--card-border-color)',
          padding: 12,
        }}
        wrap="nowrap"
      >
        <div
          data-published={shown.perspective === 'published' ? '' : undefined}
          data-testid="local-set"
          style={{
            alignItems: 'center',
            background: stateToneOf(shown.perspective).bg,
            borderRadius: 9999,
            boxShadow: local ? LOCAL_OUTLINE : undefined,
            display: 'inline-flex',
            gap: 6,
            padding: 4,
          }}
        >
          <Pick
            icon={
              <ReleaseAvatarIcon
                release={shown.perspective === 'published' ? 'published' : 'drafts'}
              />
            }
            items={layers.map((layer) => ({
              key: layer.key,
              text: layer.text,
              selected: shown.perspective === layer.key,
              onClick: () => set({...shown, perspective: layer.key}),
            }))}
            style={WHITE_CHIP}
            testId="local-state"
            text={layerText}
          />
          <Pick
            icon={<RhombusIcon style={{'--card-icon-color': LOCAL_COLOR} as CSSProperties} />}
            items={[
              {
                key: NONE,
                text: 'Default',
                selected: shown.variant === NONE,
                onClick: () => set({...shown, variant: NONE}),
              },
              ...singles.map((d) => ({
                key: shortId(d._id),
                text: d.metadata?.title ?? shortId(d._id),
                selected: shown.variant === shortId(d._id),
                onClick: () => set({...shown, variant: shortId(d._id)}),
              })),
            ]}
            style={WHITE_CHIP}
            testId="local-variants"
            text={shown.variant === NONE ? 'Default' : titleOf(shown.variant)}
          />
        </div>
        <Button
          data-testid="local-follow-global"
          fontSize={1}
          mode="bleed"
          onClick={() => {
            set(null)
            setOpen(false)
          }}
          padding={2}
          text="Follow global perspective"
        />
      </Flex>
    </div>
  )
}
