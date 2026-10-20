import {CloseIcon} from '@sanity/icons/Close'
import {Box, Flex, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {type ReactElement, useState} from 'react'
import {ReleaseAvatarIcon, usePerspective, useSetPerspective} from 'sanity'

import {Popover} from '../../../packages/sanity/src/ui-components/popover/Popover'
import {Chip} from '../../../packages/sanity/src/core/releases/components/Chip'
import {MenuButton} from '../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {usePerspectiveState} from '../c1/state'
import {DocumentVersionsLens, WideOverlay} from '../c5/ActionableLenses'
import {useCorpus} from '../c5/useCorpus'
import {InventoryExpandContext} from '../c4/inventory/expandContext'
import {LiveInventory} from '../c4/inventory/LiveInventory'
import {useVariantDefinitions} from '../c1/world'
import {useVersionList} from '../data/useVersionList'
import {type AudienceVersion} from '../data/versions'

/**
 * C2 V1 (document pills), live data: one row of version pills for the open document. It is added under the pane
 * header; stock Studio's own pills stay where they are. Two forms, from the Figma drafts (C2 227:1925 and 227:1929).
 * "It does not have to be perfect": variant rows are read-only here (stock Studio with the flag off has no variant
 * route), release rows switch the studio perspective.
 */

const stateWord = (v: AudienceVersion) =>
  v.state === 'published'
    ? 'Published'
    : v.state === 'draft'
      ? 'Draft'
      : v.release
        ? `${v.release}${v.when ? ` · ${v.when}` : ''}`
        : v.state

function glyph(v: AudienceVersion) {
  if (v.state === 'published') return <ReleaseAvatarIcon release="published" />
  if (v.state === 'draft') return <ReleaseAvatarIcon release="drafts" />
  return <ReleaseAvatarIcon releaseType={v.state === 'scheduled' ? 'scheduled' : v.state === 'asap' ? 'asap' : 'undecided'} />
}

function DropdownPill(props: {text: string; items: {key: string; text: string; icon: ReactElement; onClick?: () => void}[]; testId: string}) {
  return (
    <MenuButton
      button={<Chip data-testid={props.testId} iconRight={ChevronDownIcon} mode="ghost" text={props.text} />}
      id={props.testId}
      menu={
        <Menu padding={1}>
          {props.items.length ? (
            props.items.map((item) => (
              <MenuItem disabled={!item.onClick} icon={item.icon} key={item.key} onClick={item.onClick} text={item.text} />
            ))
          ) : (
            <MenuItem disabled text="None" />
          )}
        </Menu>
      }
      popover={{placement: 'bottom-start', portal: true}}
    />
  )
}

const TRACK_RADIUS = 'var(--v2-pill-radius, 999px)'

/**
 * Option B's toggle: a grey track (the default badge background, a 1px default border, the Shape radius), 25px high with 2px padding;
 * two 21px segments with 12px side padding and 6px between the dot and the label. The chosen segment is a white raised thumb with
 * 13px medium text; the other is 13px regular and muted. A green dot for Published, an amber ring for Draft. With a release shown,
 * neither half is chosen.
 */
function PublishedToggle(props: {chosen: 'published' | 'drafts' | null; hasPublished: boolean; onPick: (version: 'published' | 'drafts') => void}) {
  const segment = (version: 'published' | 'drafts', label: string, dot: ReactElement, disabled = false) => {
    const chosen = props.chosen === version
    return (
      <button
        aria-checked={chosen}
        data-testid={`toggle-${version}`}
        disabled={disabled}
        onClick={() => props.onPick(version)}
        role="radio"
        style={{
          alignItems: 'center',
          background: chosen ? 'var(--card-bg-color, #fff)' : 'transparent',
          border: 0,
          borderRadius: `calc(${TRACK_RADIUS} - 2px)`,
          boxShadow: chosen ? '0 1px 3px rgba(0, 0, 0, 0.18)' : 'none',
          color: chosen ? 'var(--card-fg-color)' : 'var(--card-muted-fg-color)',
          cursor: disabled ? 'default' : 'pointer',
          display: 'inline-flex',
          font: 'inherit',
          fontSize: 13,
          fontWeight: chosen ? 500 : 400,
          gap: 6,
          height: 21,
          opacity: disabled ? 0.5 : 1,
          padding: '0 12px',
        }}
        type="button"
      >
        {dot}
        {label}
      </button>
    )
  }
  const dot = (kind: 'published' | 'drafts') => (
    <span
      aria-hidden="true"
      style={{
        background: kind === 'published' ? 'var(--card-badge-positive-dot-color)' : 'transparent',
        border: kind === 'drafts' ? '1.5px solid var(--card-badge-caution-dot-color)' : 0,
        borderRadius: 9999,
        boxSizing: 'border-box',
        height: 8,
        width: 8,
      }}
    />
  )
  return (
    <div
      aria-label="Published or draft"
      data-testid="published-toggle"
      role="radiogroup"
      style={{
        alignItems: 'center',
        background: 'var(--card-badge-default-bg-color)',
        border: '1px solid var(--card-border-color)',
        borderRadius: TRACK_RADIUS,
        boxSizing: 'border-box',
        display: 'inline-flex',
        height: 25,
        padding: 1,
      }}
    >
      {segment('published', 'Published', dot('published'), !props.hasPublished)}
      {segment('drafts', 'Draft', dot('drafts'))}
    </div>
  )
}

/** A variant that is the current view: a removable chip (suggest tone) beside the toggle; the x returns to the base document. */
function VariantChip(props: {text: string; onRemove: () => void}) {
  return (
    <span
      data-testid="variant-chip"
      style={{
        alignItems: 'center',
        background: 'var(--card-badge-suggest-bg-color)',
        border: '1px solid var(--card-badge-suggest-dot-color)',
        borderRadius: TRACK_RADIUS,
        boxSizing: 'border-box',
        color: 'var(--card-badge-suggest-fg-color)',
        display: 'inline-flex',
        fontSize: 13,
        fontWeight: 500,
        gap: 4,
        height: 25,
        padding: '0 4px 0 10px',
      }}
    >
      {props.text}
      <button
        aria-label="Back to the base document"
        data-testid="variant-chip-remove"
        onClick={props.onRemove}
        style={{alignItems: 'center', background: 'none', border: 0, borderRadius: 9999, color: 'inherit', cursor: 'pointer', display: 'inline-flex', height: 19, justifyContent: 'center', padding: 0, width: 19}}
        type="button"
      >
        <CloseIcon style={{fontSize: 16}} />
      </button>
    </span>
  )
}

export function DocumentPillsV1({documentId, option, manage}: {documentId: string; option: 'a' | 'b'; manage?: ReactElement}) {
  const versions = useVersionList(documentId)
  const {selectedPerspectiveName} = usePerspective()
  const setPerspective = useSetPerspective()
  const address = usePerspectiveState()
  const definitions = useVariantDefinitions()
  const corpus = useCorpus()
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [otherAnchor, setOtherAnchor] = useState<HTMLElement | null>(null)
  // Never render nothing: the pane header's chip scroller observes this row's element.
  if (!versions) return <Flex data-testid={`doc-pills-${option}`} gap={1} />

  const base = versions.filter((v) => v.audience === null)
  const published = base.find((v) => v.state === 'published')
  const draft = base.find((v) => v.state === 'draft')
  // Every version that sits in a release counts, base or variant.
  const releases = versions.filter((v) => v.release)
  const variants = versions.filter((v) => v.audience !== null)
  // Option B: everything but the base's published and draft, and the variants grouped by audience with what each has.
  const others = versions.filter((v) => v.audience !== null || !!v.release)
  const byAudience = [...variants.reduce((map, v) => map.set(v.audience as string, [...(map.get(v.audience as string) ?? []), v]), new Map<string, AudienceVersion[]>())]
  const narrowed = Object.keys(address.chosen).length > 0
  const current = selectedPerspectiveName ?? 'drafts'

  // Choosing a variant sets the address (version and values) like the inventory and the C1 row do.
  const selectVariant = (v: AudienceVersion) => () => {
    const definition = definitions.find((d) => d._id.replace(/^_\.variants\./, '') === v.variantId)
    setPerspective(v.bundleId ?? (v.state === 'published' ? 'published' : 'drafts'))
    address.setChosen(definition ? definition.conditions : {})
    if (definition) address.setRowShown(true)
  }
  const variantItem = (v: AudienceVersion, i: number) => ({
    key: `${v.audience}-${i}`,
    text: `${v.audience} · ${stateWord(v)}`,
    icon: glyph(v),
    onClick: selectVariant(v),
  })

  const releaseItems = releases.map((v) => ({
    key: `${v.bundleId}-${v.audience ?? 'base'}`,
    text: `${v.audience ? `${v.audience} · ` : ''}${stateWord(v)}`,
    icon: glyph(v),
    onClick: () => v.bundleId && setPerspective(v.bundleId),
  }))

  return (
    // It replaces the stock pills in the pane header (PROPOSED slot), so it takes the header's own row, no border.
    <Flex align="center" data-testid={`doc-pills-${option}`} gap={2} style={{flex: '1 1 0%', minWidth: 0}} wrap="wrap">
      {option === 'a' ? (
        <>
          {/* Follows PR #39: Variants first, a divider, then Published, Draft and Releases. */}
          <DropdownPill
            items={variants.map(variantItem)}
            testId="pills-variants"
            text={`Variants · ${variants.length}`}
          />
          <div aria-hidden data-testid="pills-divider" style={{alignSelf: 'stretch', width: 1, margin: '4px', background: 'var(--card-border-color)'}} />
          {published && (
            <Chip icon={<ReleaseAvatarIcon release="published" />} mode="ghost" onClick={() => setPerspective('published')} selected={current === 'published'} text="Published" />
          )}
          {/* The stock row always offers Draft (it can be created), so this does too. */}
          <Chip icon={<ReleaseAvatarIcon release="drafts" />} mode="ghost" onClick={() => setPerspective('drafts')} selected={current === 'drafts'} text="Draft" />
          <DropdownPill
            items={releaseItems}
            testId="pills-releases"
            text={`Releases · ${releases.length}`}
          />
        </>
      ) : (
        <>
          {/* Option B: only the toggle and one "Other versions · N" button; a variant that is the current view is a chip beside the toggle. */}
          <PublishedToggle
            chosen={current === 'published' ? 'published' : current === 'drafts' ? 'drafts' : null}
            hasPublished={!!published}
            onPick={(version) => setPerspective(version)}
          />
          {narrowed ? <VariantChip onRemove={() => address.setChosen({})} text={address.valueTitles.join(', ')} /> : null}
          <span ref={setOtherAnchor} style={{display: 'inline-flex'}}>
            <MenuButton
              button={<Chip data-testid="other-versions" iconRight={ChevronDownIcon} mode="ghost" style={{height: 25}} text={`Other versions · ${others.length}`} />}
              id="other-versions"
              menu={
                <Menu padding={1}>
                  {byAudience.length ? <MenuItem disabled text="Variants" /> : null}
                  {byAudience.map(([audience, list]) => (
                    <MenuItem
                      icon={glyph(list[0])}
                      key={audience}
                      onClick={selectVariant(list[0])}
                      text={`${audience} · ${list.map(stateWord).join(', ')}`}
                    />
                  ))}
                  {releaseItems.length ? <MenuItem disabled text="Releases" /> : null}
                  {releaseItems.map((item) => (
                    <MenuItem icon={item.icon} key={item.key} onClick={item.onClick} text={item.text} />
                  ))}
                  {!byAudience.length && !releaseItems.length ? <MenuItem disabled text="No other versions" /> : null}
                  <MenuItem data-testid="open-inventory" onClick={() => setInventoryOpen(true)} text="Open the version inventory…" />
                </Menu>
              }
              popover={{placement: 'bottom-start', portal: true}}
            />
          </span>
          <Popover
            content={
              <Box style={{height: 520, overflow: 'hidden', width: 360}}>
                <InventoryExpandContext.Provider value={corpus ? () => { setInventoryOpen(false); setExpanded(true) } : null}>
                  <LiveInventory documentId={documentId} title={corpus?.docs.find((d) => d.id === documentId)?.title ?? documentId} />
                </InventoryExpandContext.Provider>
              </Box>
            }
            floatingBoundary={document.body}
            open={inventoryOpen}
            padding={0}
            placement="bottom-start"
            portal
            radius={3}
            referenceBoundary={document.body}
            referenceElement={otherAnchor}
            shadow={3}
          />
          {expanded && corpus ? (
            <WideOverlay onClose={() => setExpanded(false)} title="Version inventory">
              <DocumentVersionsLens corpus={corpus} definitions={definitions} docId={documentId} onPin={() => undefined} />
            </WideOverlay>
          ) : null}
        </>
      )}
      {manage}
    </Flex>
  )
}
