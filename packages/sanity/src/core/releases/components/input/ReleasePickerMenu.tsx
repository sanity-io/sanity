import {Card, Text} from '@sanity/ui'
import {useCallback, useMemo, useRef} from 'react'
import {styled} from 'styled-components'

import {CommandList, type CommandListHandle} from '../../../components/commandList/CommandList'
import {useAllReleases} from '../../store/useAllReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {ReleasePickerItem} from './ReleasePickerItem'

const ARCHIVED_RELEASE_STATES = ['archived', 'published']
const ITEM_HEIGHT = 33
const MAX_ITEMS = 7

const MenuCard = styled(Card)`
  max-height: ${ITEM_HEIGHT * MAX_ITEMS + 8}px;
  min-width: 220px;
  max-width: 320px;
  padding: 4px 0;
  width: max-content;
`

interface ReleasePickerMenuProps {
  onSelect: (releaseId: string) => void
}

export function ReleasePickerMenu(props: ReleasePickerMenuProps) {
  const {onSelect} = props
  const {data: releases, loading, error} = useAllReleases()
  const commandListRef = useRef<CommandListHandle>(null)

  // Filter to active releases only (exclude archived/published)
  const activeReleases = useMemo(
    () => releases.filter((r) => !ARCHIVED_RELEASE_STATES.includes(r.state)),
    [releases],
  )

  const renderItem = useCallback(
    (release) => {
      const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
      return (
        <ReleasePickerItem
          release={release}
          releaseId={releaseId}
          onSelect={() => onSelect(releaseId)}
        />
      )
    },
    [onSelect],
  )

  if (loading) {
    return (
      <Card padding={3} shadow={2} radius={2}>
        <Text size={1} muted>
          Loading releases...
        </Text>
      </Card>
    )
  }

  if (error) {
    return (
      <Card padding={3} shadow={2} radius={2}>
        <Text size={1} tone="critical">
          Failed to load releases
        </Text>
      </Card>
    )
  }

  if (activeReleases.length === 0) {
    return (
      <Card padding={3} shadow={2} radius={2}>
        <Text size={1} muted>
          No active releases available
        </Text>
      </Card>
    )
  }

  return (
    <MenuCard shadow={2} radius={2}>
      <CommandList
        activeItemDataAttr="data-hovered"
        ariaLabel="Select a release to link"
        fixedHeight
        itemHeight={ITEM_HEIGHT}
        items={activeReleases}
        getItemKey={(index) => activeReleases[index]._id}
        padding={0}
        ref={commandListRef}
        renderItem={renderItem}
        canReceiveFocus
        autoFocus="list"
      />
    </MenuCard>
  )
}
