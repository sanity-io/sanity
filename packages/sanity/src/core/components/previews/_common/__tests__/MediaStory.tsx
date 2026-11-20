import {BookIcon} from '@sanity/icons/Book'
import {Card} from '@sanity/ui'
import {Text, Flex, VStack} from 'ui5'

import {PREVIEW_SIZES} from '../../constants'
import {Media} from '../Media'

const DEFAULT_DIMENSIONS = {
  ...PREVIEW_SIZES.default.media,
  aspect: 1,
  fit: 'crop' as const,
}

const COMPACT_DIMENSIONS = {
  ...PREVIEW_SIZES.compact.media,
  aspect: 1,
  fit: 'crop' as const,
}

function Label({children}: {children: string}) {
  return (
    <Text muted size={1} weight="medium" as="div" trim={true}>
      {children}
    </Text>
  )
}

/**
 * Chromatic sentinel for preview media after the ui5 Text migration: a string
 * initial ("AB") inherits `--card-fg-color` so it stays readable on a selected
 * Sanity UI card, an icon uses `--card-icon-color`, and the inset border token
 * is the same `--card-fg-color` at 10% opacity. Fixture copy and a book icon
 * only — no image URLs.
 */
export function MediaStory() {
  return (
    <Card padding={4} style={{maxWidth: 420}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Label>string, default layout</Label>
          <Media dimensions={DEFAULT_DIMENSIONS} layout="default" media="AB" />
        </VStack>
        <VStack gap={2}>
          <Label>string on a selected card</Label>
          <Card as="button" padding={2} radius={2} selected>
            <Media dimensions={DEFAULT_DIMENSIONS} layout="default" media="AB" />
          </Card>
        </VStack>
        <VStack gap={2}>
          <Label>string, compact layout</Label>
          <Media dimensions={COMPACT_DIMENSIONS} layout="compact" media="AB" />
        </VStack>
        <VStack gap={2}>
          <Label>icon</Label>
          <Flex alignItems="center" gap={3}>
            <Media dimensions={DEFAULT_DIMENSIONS} layout="default" media={<BookIcon />} />
            <Media dimensions={COMPACT_DIMENSIONS} layout="compact" media={<BookIcon />} />
          </Flex>
        </VStack>
      </VStack>
    </Card>
  )
}
