import {Card, Stack, Text} from '@sanity/ui'

import {FromTo} from '../FromTo'

function DiffSide({label, detail}: {label: string; detail?: string}) {
  return (
    <Card border padding={3} radius={2}>
      <Stack gap={2}>
        <Text size={1} weight="medium">
          {label}
        </Text>
        {detail && (
          <Text muted size={1}>
            {detail}
          </Text>
        )}
      </Stack>
    </Card>
  )
}

// A two-line "from" next to a one-line "to" so the columns differ in height
// and `align` visibly moves the shorter side.
const TALL_FROM = <DiffSide detail="hero-2023.jpg · 1.2 MB" label="Previous file" />
const SHORT_TO = <DiffSide label="Current file" />

/**
 * Chromatic sentinel for the review-changes FromTo layout after the ui5 Flex
 * migration: inline vs grid column templates, the arrow slot for from+to vs
 * to-only, and `align` (top vs center) on uneven column heights — including
 * the `align="center" layout="grid"` call ImageFieldDiff makes. Labels are
 * fixtures (no document values, no timestamps).
 */
export function FromToLayoutStory() {
  return (
    <Card padding={4} style={{maxWidth: 560}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            inline, align top (default)
          </Text>
          <FromTo from={TALL_FROM} to={SHORT_TO} />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            inline, align center
          </Text>
          <FromTo align="center" from={TALL_FROM} to={SHORT_TO} />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            grid from and to (FileFieldDiff)
          </Text>
          <FromTo from={TALL_FROM} layout="grid" to={SHORT_TO} />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            grid, align center (ImageFieldDiff)
          </Text>
          <FromTo align="center" from={TALL_FROM} layout="grid" to={SHORT_TO} />
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
