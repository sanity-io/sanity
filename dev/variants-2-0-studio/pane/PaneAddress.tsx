import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {Box, Button, Card, Flex, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type ReactElement, useEffect, useRef, useState} from 'react'
import {ReleaseAvatarIcon, useClient} from 'sanity'
import {useRouter} from 'sanity/router'
import {usePaneRouter} from 'sanity/structure'

import {Chip} from '../../../packages/sanity/src/core/releases/components/Chip'
import {MenuButton} from '../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {Popover} from '../../../packages/sanity/src/ui-components/popover/Popover'
import {useVariantDefinitions} from '../c1/world'
import {InventoryExpandContext} from '../c4/inventory/expandContext'
import {LiveInventory} from '../c4/inventory/LiveInventory'
import {createVariantVersion} from '../c7/Banners'
import {useVersionList} from '../data/useVersionList'
import {useOption} from '../design-options/store'
import {useResultToast} from '../toasts/ResultToast'

// Option `paneAddress` (E9, Figma E9 413:5, states L0 to L6). One rule: a pane names its address ONLY when it differs from the global
// perspective (the Showing row). Vocabulary: global perspective = what the whole studio shows; local perspective = what one pane shows.
//   A  the shipped chips (not here)
//   B  a "Documents · N" button opens the inventory; the pane always follows the global perspective
//   C  B, plus a local row when the pane differs: layer chip, variant chip, a "differs" tag, and "Follow global perspective" at the end.
//      Below 380 px the tag is the menu (L6). The pane keeps its local perspective when the global one changes (L4).
// The local perspective is the pane params `localPerspective` and `localVariant` (core: DocumentPerspectiveProvider, PROPOSED).

interface Address {
  perspective: string
  variant: string
}

const NONE = 'none'

/** The global address (router sticky params), the pane's local one (pane params), and whether the pane differs from the global one. */
export function usePaneAddress() {
  const paneRouter = usePaneRouter()
  const router = useRouter()
  const params = paneRouter.params as {localPerspective?: string; localVariant?: string}
  const stickyPerspective = router.stickyParams.perspective
  const stickyVariant = router.stickyParams.variant
  const global: Address = {
    perspective: typeof stickyPerspective === 'string' ? stickyPerspective : 'drafts',
    variant: typeof stickyVariant === 'string' ? stickyVariant : NONE,
  }
  const held = Boolean(params.localPerspective || params.localVariant)
  const local: Address = held
    ? {perspective: params.localPerspective ?? 'drafts', variant: params.localVariant ?? NONE}
    : global
  const differs =
    held && (local.perspective !== global.perspective || local.variant !== global.variant)
  const set = (next: Address | null) =>
    paneRouter.setParams({
      ...paneRouter.params,
      localPerspective: next?.perspective,
      localVariant: next?.variant,
    })
  return {held, local, global, differs, set}
}

export function Pick(props: {
  text: string
  testId: string
  items: {
    key: string
    text: string
    icon?: ReactElement
    selected: boolean
    onClick: () => void
    disabled?: boolean
  }[]
  icon?: ReactElement
}) {
  return (
    <MenuButton
      button={
        <Chip
          data-testid={props.testId}
          icon={props.icon}
          iconRight={ChevronDownIcon}
          mode="ghost"
          text={props.text}
        />
      }
      id={props.testId}
      menu={
        <Menu padding={1}>
          {props.items.map((item) => (
            <MenuItem
              icon={item.icon}
              key={item.key}
              onClick={item.onClick}
              pressed={item.selected}
              text={item.text}
            />
          ))}
        </Menu>
      }
      popover={{placement: 'bottom-start', portal: true}}
    />
  )
}

export const layerLabel = (perspective: string) =>
  perspective === 'published' ? 'Published' : perspective === 'drafts' ? 'Drafts' : perspective

/** B and C: the Documents button with a count. It replaces the pane header's version chips and opens the inventory. */
export function DocumentsCount(props: {documentId: string; manage?: ReactElement}) {
  const {documentId} = props
  const versions = useVersionList(documentId)
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  return (
    <Flex align="center" data-testid="doc-documents" gap={2} style={{flex: '1 1 0%', minWidth: 0}}>
      <Box flex={1} />
      <span ref={setAnchor} style={{display: 'inline-flex'}}>
        <Button
          aria-label={`Documents, ${versions?.length ?? 0} versions`}
          data-testid="documents-count"
          fontSize={1}
          icon={DocumentsIcon}
          mode="ghost"
          onClick={() => setOpen((o) => !o)}
          padding={2}
          selected={open}
          text={versions ? String(versions.length) : '…'}
        />
      </span>
      <Popover
        content={
          <Box style={{height: 520, overflow: 'hidden', width: 360}}>
            <InventoryExpandContext.Provider value={null}>
              <LiveInventory documentId={documentId} title={documentId} />
            </InventoryExpandContext.Provider>
          </Box>
        }
        floatingBoundary={document.body}
        open={open}
        padding={0}
        placement="bottom-end"
        portal
        radius={3}
        referenceBoundary={document.body}
        referenceElement={anchor}
        shadow={3}
      />
      {props.manage}
    </Flex>
  )
}

const NARROW = 380

/** C (and compare B and C): the local perspective row under the pane header, only while the pane differs from the global perspective. */
export function LocalRow(props: {documentId: string; documentType: string}) {
  const {documentId} = props
  const {held, local, global, differs, set} = usePaneAddress()
  const versions = useVersionList(documentId)
  const definitions = useVariantDefinitions()
  const localMatch = useOption('localMatch')
  const showToast = useResultToast()
  const client = useClient({apiVersion: 'X'})
  const ref = useRef<HTMLDivElement | null>(null)
  const [narrow, setNarrow] = useState(false)
  const [creating, setCreating] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const observer = new ResizeObserver(() => setNarrow(el.getBoundingClientRect().width < NARROW))
    observer.observe(el)
    return () => observer.disconnect()
  })

  // L5a / L5b: the global perspective changed to match the held one. Default (L5b): the pane quietly follows again, so no row.
  const matches = held && !differs
  if (!held || (matches && localMatch !== 'b')) return <div ref={ref} />

  const titleOf = (variantId: string) =>
    definitions.find((d) => d._id.replace(/^_\.variants\./, '') === variantId)?.metadata?.title ??
    variantId
  const variantIds = [
    ...new Set((versions ?? []).map((v) => v.variantId).filter((v): v is string => !!v)),
  ]
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

  // L3: the version asked for does not exist at this address.
  const variantId = local.variant === NONE ? null : local.variant
  const exists = (versions ?? []).some(
    (v) =>
      (v.variantId ?? null) === variantId &&
      (local.perspective === 'published'
        ? v.state === 'published'
        : local.perspective === 'drafts'
          ? v.state === 'draft'
          : v.bundleId === local.perspective),
  )
  const missing = !!versions && !exists
  const missingText = `no ${variantId ? titleOf(variantId) : 'base'} ${local.perspective === 'published' ? 'version' : 'draft'} yet`

  const create = async () => {
    if (!variantId) return
    setCreating(true)
    const failure = await createVariantVersion(
      client.withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false}),
      {
        documentId,
        variantId,
        bundleId: local.perspective === 'published' ? 'drafts' : local.perspective,
      },
    )
    setCreating(false)
    if (failure) showToast('failed', {variant: titleOf(variantId), verb: 'create', detail: failure})
    else {
      window.dispatchEvent(new Event('focus'))
      showToast('version-created', {variant: titleOf(variantId), document: 'This document'})
    }
  }

  const follow = () => set(null)
  const tag = matches ? (
    <span
      data-testid="local-tag"
      style={tagStyle('positive')}
      title="The global perspective now matches this pane"
    >
      matches global
    </span>
  ) : missing ? (
    <span data-testid="local-tag" style={tagStyle('caution')}>
      {missingText}
    </span>
  ) : (
    <span
      data-testid="local-tag"
      style={tagStyle('caution')}
      title="Local perspective: this pane does not follow the global perspective"
    >
      differs
    </span>
  )
  const tagControl = narrow ? (
    <MenuButton
      button={
        <button
          data-testid="local-tag-menu"
          style={{background: 'none', border: 0, cursor: 'pointer', padding: 0}}
          type="button"
        >
          {tag}
        </button>
      }
      id="local-tag-menu"
      menu={
        <Menu padding={1}>
          <MenuItem data-testid="follow-global" onClick={follow} text="Follow global perspective" />
        </Menu>
      }
      popover={{placement: 'bottom-start', portal: true}}
    />
  ) : (
    tag
  )

  return (
    <div data-testid="local-row" ref={ref} style={{paddingBlock: 8, paddingInline: 12}}>
      <Flex align="center" gap={2} wrap="nowrap">
        <Pick
          icon={
            <ReleaseAvatarIcon
              release={local.perspective === 'published' ? 'published' : 'drafts'}
            />
          }
          items={[
            {
              key: 'published',
              text: 'Published',
              selected: local.perspective === 'published',
              onClick: () => set({...local, perspective: 'published'}),
            },
            {
              key: 'drafts',
              text: 'Drafts',
              selected: local.perspective === 'drafts',
              onClick: () => set({...local, perspective: 'drafts'}),
            },
            ...releases.map(([id, title]) => ({
              key: id,
              text: title,
              selected: local.perspective === id,
              onClick: () => set({...local, perspective: id}),
            })),
          ]}
          testId="local-layer"
          text={layerLabel(local.perspective)}
        />
        <Pick
          items={[
            {
              key: NONE,
              text: 'Base',
              selected: local.variant === NONE,
              onClick: () => set({...local, variant: NONE}),
            },
            ...variantIds.map((id) => ({
              key: id,
              text: titleOf(id),
              selected: local.variant === id,
              onClick: () => set({...local, variant: id}),
            })),
          ]}
          testId="local-variant"
          text={local.variant === NONE ? 'Base' : titleOf(local.variant)}
        />
        {tagControl}
        <Box flex={1} />
        {missing && variantId && !narrow ? (
          <Button
            data-testid="local-create"
            disabled={creating}
            fontSize={1}
            mode="bleed"
            onClick={() => void create()}
            padding={2}
            text="Create draft"
          />
        ) : null}
        {narrow ? null : (
          <Button
            data-testid="follow-global"
            fontSize={1}
            mode="bleed"
            onClick={follow}
            padding={2}
            text="Follow global perspective"
          />
        )}
      </Flex>
      {/* The global perspective, one row up, names the other side (open question 3 asks whether "differs" should say it). */}
      <Card display="none">
        <Text
          size={0}
        >{`Global: ${layerLabel(global.perspective)}${global.variant === NONE ? '' : ` · ${titleOf(global.variant)}`}`}</Text>
      </Card>
    </div>
  )
}

function tagStyle(tone: 'caution' | 'positive') {
  return {
    background: `var(--card-badge-${tone}-bg-color)`,
    borderRadius: 999,
    color: `var(--card-badge-${tone}-fg-color)`,
    fontSize: 12,
    lineHeight: '18px',
    padding: '1px 10px',
    whiteSpace: 'nowrap' as const,
  }
}
