import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {BlockObjectFallback, TextBlockFallback} from '../BlockFallback'

const DEFAULT_GUTTER = {hasBlockActions: false, isFullscreen: false, nested: false}
const NORMAL = {...DEFAULT_GUTTER, style: 'normal'}
const HEADING = {...DEFAULT_GUTTER, style: 'h1'}
const LIST_ITEM = {...DEFAULT_GUTTER, listItem: 'bullet'}

/**
 * Chromatic sentinel for the Portable Text lazy-block placeholders after the
 * mixed ui5 Box/Flex and Sanity UI Skeleton swap. Pins text-block vertical
 * padding by style (normal, heading, list), the top-level vs nested vs
 * fullscreen-with-actions gutter, and the bordered block-object preview row.
 * Animated skeletons pause at their end state in Chromatic.
 */
export function BlockFallbackStory() {
  return (
    <Card padding={4} style={{maxWidth: 640}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            text · normal
          </Text>
          <TextBlockFallback {...NORMAL} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            text · heading
          </Text>
          <TextBlockFallback {...HEADING} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            text · list item
          </Text>
          <TextBlockFallback {...LIST_ITEM} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            text · nested
          </Text>
          <TextBlockFallback {...NORMAL} nested />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            text · fullscreen with actions
          </Text>
          <TextBlockFallback {...NORMAL} hasBlockActions isFullscreen />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            object · default
          </Text>
          <BlockObjectFallback {...DEFAULT_GUTTER} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            object · nested
          </Text>
          <BlockObjectFallback hasBlockActions={false} isFullscreen={false} nested />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            object · fullscreen with actions
          </Text>
          <BlockObjectFallback hasBlockActions isFullscreen nested={false} />
        </VStack>
      </VStack>
    </Card>
  )
}
