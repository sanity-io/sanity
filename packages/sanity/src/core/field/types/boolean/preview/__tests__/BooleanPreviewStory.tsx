import {hues} from '@sanity/color'
import {Card} from '@sanity/ui'
import {Text, Flex, VStack} from 'ui5'

import {type UserColor} from '../../../../../user-color/types'
import {Checkbox, Switch} from '../BooleanPreview'

const COLOR: UserColor = {
  name: 'blue',
  background: hues.blue[100].hex,
  border: hues.blue[300].hex,
  text: hues.blue[700].hex,
  tints: hues.blue,
}

/**
 * Chromatic sentinel for review-changes boolean preview SVGs (checkbox and
 * switch). Pins fill/stroke from a fixture user color across checked,
 * unchecked, and undefined. No i18n, no timestamps.
 */
export function BooleanPreviewStory() {
  return (
    <Card padding={4} style={{maxWidth: 420}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            checkbox
          </Text>
          <Flex alignItems="center" gap={3}>
            <Checkbox checked={true} color={COLOR} />
            <Checkbox checked={false} color={COLOR} />
            <Checkbox checked={undefined} color={COLOR} />
          </Flex>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            switch
          </Text>
          <Flex alignItems="center" gap={3}>
            <Switch checked={true} color={COLOR} />
            <Switch checked={false} color={COLOR} />
            <Switch checked={undefined} color={COLOR} />
          </Flex>
        </VStack>
      </VStack>
    </Card>
  )
}
