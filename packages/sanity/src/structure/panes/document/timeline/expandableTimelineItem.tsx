import {Box, Menu} from '@sanity/ui'
import {type MouseEvent, useCallback, useMemo, useState} from 'react'
import {type Chunk, ContextMenuButton, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {MenuButton, MenuItem} from '../../../../ui-components'
import {structureLocaleNamespace} from '../../../i18n'
import {TimelineItem} from './timelineItem'

const ExpandedWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: 0fr;
  overflow: hidden;
  transition: all 200ms ease;
  padding-left: 16px;
  &[data-expanded] {
    grid-auto-rows: 1fr;
    padding-top: 4px;
    padding-bottom: 4px;
    gap: 4px;
  }
`

function TimelineItemMenu({
  chunkId,
  isExpanded,
  onExpandClick,
}: {
  chunkId: string
  isExpanded: boolean
  onExpandClick: () => void
}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const handleExpandClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      // Avoid the click event to propagate to the parent button and closing the popover
      e.stopPropagation()
      onExpandClick()
    },
    [onExpandClick],
  )
  return (
    <MenuButton
      id={`timeline-item-menu-button-${chunkId}`}
      button={
        <ContextMenuButton
          aria-label={t('timeline-item.menu-button.aria-label')}
          size="large"
          tooltipProps={{content: t('timeline-item.menu-button.tooltip')}}
        />
      }
      menu={
        <Menu padding={1}>
          <MenuItem
            text={t(
              isExpanded
                ? 'timeline-item.menu.action-collapse'
                : 'timeline-item.menu.action-expand',
            )}
            onClick={handleExpandClick}
          />
        </Menu>
      }
    />
  )
}

interface ExpandableTimelineItemProps {
  chunk: Chunk
  onSelect: (chunk: Chunk) => void
  selectedChunkId?: string
  /**
   * Chunks that are squashed together on publish.
   * e.g. all the draft mutations are squashed into a single `publish` chunk when the document is published.
   */
  squashedChunks: Chunk[]
}

export function ExpandableTimelineItem(props: ExpandableTimelineItemProps) {
  const {selectedChunkId, squashedChunks, chunk, onSelect} = props
  const [isExpanded, setIsExpanded] = useState(
    // If the selected chunk is a squashed chunk, expand the item
    () => !!squashedChunks.find((c) => c.id === selectedChunkId),
  )
  const chunkId = chunk.id
  const authorUserIds = Array.from(chunk.authors)

  const optionsMenu = useMemo(
    () =>
      squashedChunks.length > 1 ? (
        <TimelineItemMenu
          chunkId={chunkId}
          isExpanded={isExpanded}
          onExpandClick={() => setIsExpanded(!isExpanded)}
        />
      ) : null,
    [isExpanded, chunkId, squashedChunks.length],
  )
  const collaborators = Array.from(
    new Set(squashedChunks?.flatMap((c) => Array.from(c.authors)) || []),
  ).filter((id) => !authorUserIds.includes(id))

  return (
    <>
      <TimelineItem
        chunk={chunk}
        onSelect={onSelect}
        isSelected={selectedChunkId === chunk.id}
        timestamp={chunk.endTimestamp}
        type={chunk.type}
        collaborators={collaborators}
        optionsMenu={optionsMenu}
      />
      {squashedChunks && squashedChunks.length > 1 && (
        <ExpandedWrapper data-expanded={isExpanded ? '' : undefined}>
          {isExpanded &&
            squashedChunks.map((squashedChunk) => (
              <Box key={squashedChunk.id}>
                <TimelineItem
                  chunk={squashedChunk}
                  isSelected={selectedChunkId === squashedChunk.id}
                  onSelect={onSelect}
                  timestamp={squashedChunk.endTimestamp}
                  type={squashedChunk.type}
                />
              </Box>
            ))}
        </ExpandedWrapper>
      )}
    </>
  )
}
