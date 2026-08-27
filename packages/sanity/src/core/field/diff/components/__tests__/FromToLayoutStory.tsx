import {Card, Stack, Text} from '@sanity/ui'

import {FromTo} from '../FromTo'

function DiffSide({label}: {label: string}) {
  return (
    <Card border padding={3} radius={2}>
      <Text size={1} weight="medium">
        {label}
      </Text>
    </Card>
  )
}

/**
 * Chromatic sentinel for the review-changes FromTo layout after the ui5 Flex
 * migration. Inline vs grid, and from+to vs to-only, all depend on Flex
 * alignment around the arrow — a spacing drift TypeScript will not catch.
 * Labels are fixtures (no document values, no timestamps).
 */
export function FromToLayoutStory() {
  return (
    <Card padding={4} style={{maxWidth: 560}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            inline from and to
          </Text>
          <FromTo from={<DiffSide label="Draft" />} to={<DiffSide label="Published" />} />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            grid from and to
          </Text>
          <FromTo
            from={<DiffSide label="Previous file" />}
            layout="grid"
            to={<DiffSide label="Current file" />}
          />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            to only
          </Text>
          <FromTo to={<DiffSide label="Added" />} />
        </Stack>
      </Stack>
    </Card>
  )
}
