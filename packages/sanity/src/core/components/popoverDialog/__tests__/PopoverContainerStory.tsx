import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {PopoverContainer} from '../PopoverContainer'

function WidthSample({label, width}: {label: string; width: 0 | 1 | 2 | 'auto'}) {
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium">
        {label}
      </Text>
      <PopoverContainer border width={width}>
        <Card padding={3} radius={2} tone="transparent">
          <Text size={1}>Popover body at width={String(width)}</Text>
        </Card>
      </PopoverContainer>
    </VStack>
  )
}

/**
 * Chromatic sentinel for the popover-hosted ui5 Container width workaround.
 * Default Container uses `maxWidth`, which lets a popover shrink to its
 * content; this wrapper sets an explicit `width` from theme container sizes
 * and caps at `maxWidth: 100%`. Borders make those widths visible. Fixture
 * copy only.
 */
export function PopoverContainerStory() {
  return (
    <Card padding={4}>
      <VStack gap={5}>
        <WidthSample label="width=0" width={0} />
        <WidthSample label="width=1" width={1} />
        <WidthSample label="width=2" width={2} />
        <WidthSample label="width=auto" width="auto" />
      </VStack>
    </Card>
  )
}
