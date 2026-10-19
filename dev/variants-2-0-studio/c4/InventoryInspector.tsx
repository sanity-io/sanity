import {DocumentsIcon} from '@sanity/icons/Documents'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type DocumentInspector, type DocumentInspectorProps, ReleaseAvatarIcon} from 'sanity'

import {useVersionList} from '../data/useVersionList'
import {STOCK_OPTION, useOption} from '../options/store'
import {PlaceholderSlot} from '../slots/PlaceholderSlot'
import {VersionTime} from '../c3/time'
import {type AudienceVersion} from '../data/versions'

/**
 * C4 V1 (inventory pane), live data. Option B (engineering direction): the document INSPECTOR, a list of every
 * version of this document: base first, then variants, with state and time. Option A (a sidebar pane) arrives from
 * Andrej's inventory side panel, so it is a placeholder here.
 */
function glyph(v: AudienceVersion) {
  if (v.state === 'published') return <ReleaseAvatarIcon release="published" />
  if (v.state === 'draft') return <ReleaseAvatarIcon release="drafts" />
  return <ReleaseAvatarIcon releaseType={v.state === 'scheduled' ? 'scheduled' : v.state === 'asap' ? 'asap' : 'undecided'} />
}

function Inventory({documentId}: DocumentInspectorProps) {
  const option = useOption('c4')
  const versions = useVersionList(documentId)
  if (option !== 'b') return <PlaceholderSlot component="c4" />
  if (!versions) return <Card padding={3}><Text muted size={1}>Loading versions…</Text></Card>

  const ordered = [...versions].sort((a, b) => (a.audience === null ? -1 : 0) - (b.audience === null ? -1 : 0))
  return (
    <Stack data-testid="inventory-inspector" gap={0} padding={3}>
      <Text size={1} weight="semibold">Versions of this document ({versions.length})</Text>
      <Stack gap={1} paddingTop={3}>
        {ordered.map((v, i) => (
          <Card key={`${v.audience}-${v.state}-${i}`} padding={2} radius={2} tone="transparent">
            <Flex align="center" gap={2}>
              <Text size={1}>{glyph(v)}</Text>
              <Stack flex={1} gap={1}>
                <Text size={1}>{v.audience ?? 'All users (Default)'}</Text>
                <Text muted size={0}>
                  <VersionTime version={v}>{(time) => [v.release, time ?? (v.release ? undefined : v.state)].filter(Boolean).join(' · ')}</VersionTime>
                </Text>
              </Stack>
            </Flex>
          </Card>
        ))}
      </Stack>
    </Stack>
  )
}

export const inventoryInspector: DocumentInspector = {
  name: 'variants-inventory',
  component: Inventory,
  useMenuItem: () => ({
    // Stock: no inspector entry at all.
    hidden: useOption('c4') === STOCK_OPTION,
    icon: DocumentsIcon,
    title: 'Versions',
    showAsAction: true,
  }),
}
