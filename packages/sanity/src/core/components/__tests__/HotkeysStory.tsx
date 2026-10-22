import {Card, Text} from '@sanity/ui'
import {Flex, VStack} from 'ui5'

import {Hotkeys} from '../Hotkeys'

/**
 * Chromatic sentinel for the studio Hotkeys wrapper around `@sanity/ui`
 * Hotkeys. `makePlatformAware` is off so keycaps stay fixture text (Ctrl /
 * Alt) instead of flipping with navigator.platform.
 */
export function HotkeysStory() {
  return (
    <Card padding={4}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            single key
          </Text>
          <Hotkeys keys={['K']} makePlatformAware={false} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            modifier chord
          </Text>
          <Flex gap={3} flexWrap="wrap">
            <Hotkeys keys={['Ctrl', 'K']} makePlatformAware={false} />
            <Hotkeys keys={['Alt', 'Shift', 'F']} makePlatformAware={false} />
          </Flex>
        </VStack>
      </VStack>
    </Card>
  )
}
