import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {Badge, Box, Button, Flex, Text} from '@sanity/ui'
import {useSyncExternalStore} from 'react'
import {ReleaseAvatarIcon} from 'sanity'
import {useDocumentPane, usePaneRouter} from 'sanity/structure'

import {Chip} from '../../../packages/sanity/src/core/releases/components/Chip'
import {useVariantDefinitions} from '../c1/world'
import {useVersionList} from '../data/useVersionList'
import {layerLabel, usePaneAddress} from './PaneAddress'
import {Pick} from './Pick'

// Open beta (locked), the document header (Figma C2 "Document header · selected for open beta": H1 521:42816, H2 521:42925, H3 521:43097):
//   H1  following global: the state pill (the layer, collapsed) and a "N Versions" pill that opens the inventory panel.
//   H2  the pill is clicked: a row "Local perspective" with the layer, the variant and "Follow global perspective"; the header pill steps aside.
//   H3  the pane differs from global: the row collapses again and the header says "Local" before the state pill.
// The footer's "Manage versions" is replaced by the Versions pill, so it is hidden here (a stock core button, no seam for it).

const NONE = 'none'
const INVENTORY = 'variants-inventory'

// Whether a pane's local row is open, shared by the header (which opens it) and the banner row (which shows it). Keyed by pane.
const opened = new Set<string>()
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

function useLocalRow(): [boolean, (open: boolean) => void] {
  const {groupIndex, siblingIndex} = usePaneRouter()
  const key = `${groupIndex}:${siblingIndex}`
  const open = useSyncExternalStore(subscribe, () => opened.has(key))
  const setOpen = (next: boolean) => {
    if (next) opened.add(key)
    else opened.delete(key)
    listeners.forEach((listener) => listener())
  }
  return [open, setOpen]
}

/** H1 and H3: the pills at the right of the header. */
export function LocalPerspectiveHeader({documentId}: {documentId: string}) {
  const {held, global, local, differs} = usePaneAddress()
  const versions = useVersionList(documentId)
  const pane = useDocumentPane()
  const [open, setOpen] = useLocalRow()
  const shown = held ? local.perspective : global.perspective
  const inventoryOpen = pane.inspector?.name === INVENTORY
  return (
    <Flex align="center" data-testid="doc-pills-c" gap={2} style={{flex: '0 0 auto', minWidth: 0}}>
      <style>{'[data-testid="action-document-group-inventory"] {display: none !important}'}</style>
      {differs && !open ? (
        <Badge data-testid="local-cue" style={{borderRadius: 999}} tone="caution">
          Local
        </Badge>
      ) : null}
      {open ? null : (
        <Chip
          data-testid="header-state"
          icon={<ReleaseAvatarIcon release={shown === 'published' ? 'published' : 'drafts'} />}
          iconRight={ChevronDownIcon}
          mode="ghost"
          onClick={() => setOpen(true)}
          text={layerLabel(shown)}
        />
      )}
      <Chip
        data-testid="header-versions"
        icon={DocumentsIcon}
        mode="ghost"
        onClick={() =>
          inventoryOpen ? pane.closeInspector(INVENTORY) : pane.openInspector(INVENTORY)
        }
        selected={inventoryOpen}
        text={`${versions?.length ?? 0} Versions`}
      />
    </Flex>
  )
}

/** H2: the row under the header, while it is open. */
export function LocalPerspectiveRow({documentId}: {documentId: string}) {
  const {global, local, set} = usePaneAddress()
  const versions = useVersionList(documentId)
  const definitions = useVariantDefinitions()
  const [open, setOpen] = useLocalRow()
  if (!open) return null

  const titleOf = (id: string) =>
    definitions.find((d) => d._id.replace(/^_\.variants\./, '') === id)?.metadata?.title ?? id
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
  // A change that makes the pane differ from global collapses the row: the header then says "Local" (H3).
  const choose = (next: {perspective: string; variant: string}) => {
    set(next)
    if (next.perspective !== global.perspective || next.variant !== global.variant) setOpen(false)
  }
  const layers = [
    {key: 'published', text: 'Published'},
    {key: 'drafts', text: 'Drafts'},
    ...releases.map(([id, title]) => ({key: id, text: title})),
  ]

  return (
    <Flex
      align="center"
      data-testid="local-perspective-row"
      gap={2}
      paddingX={3}
      paddingY={2}
      wrap="nowrap"
    >
      <Text muted size={1}>
        Local perspective
      </Text>
      <Pick
        icon={
          <ReleaseAvatarIcon release={local.perspective === 'published' ? 'published' : 'drafts'} />
        }
        items={layers.map((layer) => ({
          key: layer.key,
          text: layer.text,
          selected: local.perspective === layer.key,
          onClick: () => choose({...local, perspective: layer.key}),
        }))}
        testId="local-state"
        text={layerLabel(local.perspective)}
      />
      <Pick
        items={[
          {
            key: NONE,
            text: 'Default',
            selected: local.variant === NONE,
            onClick: () => choose({...local, variant: NONE}),
          },
          ...variantIds.map((id) => ({
            key: id,
            text: titleOf(id),
            selected: local.variant === id,
            onClick: () => choose({...local, variant: id}),
          })),
        ]}
        testId="local-variants"
        text={local.variant === NONE ? 'Default' : titleOf(local.variant)}
      />
      <Box flex={1} />
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
  )
}
