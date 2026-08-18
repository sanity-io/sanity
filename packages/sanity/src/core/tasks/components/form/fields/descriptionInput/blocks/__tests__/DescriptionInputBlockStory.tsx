import {Card, Stack, Text} from '@sanity/ui'

import {DescriptionInputBlock} from '../DescriptionInputBlock'

/**
 * Chromatic sentinel for ui5 Box padding on task description blocks.
 * Static copy only (no timestamps). Shared with the co-located Storybook
 * CSF file.
 */
export function DescriptionInputBlockStory() {
  return (
    <Card padding={4} style={{maxWidth: 360}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            short
          </Text>
          <DescriptionInputBlock>Review the hero image crop.</DescriptionInputBlock>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            wrapped
          </Text>
          <DescriptionInputBlock>
            A longer task description that should wrap inside the Box padding so a padding-top or
            padding-bottom regression is visible in Chromatic.
          </DescriptionInputBlock>
        </Stack>
      </Stack>
    </Card>
  )
}
