import {Card, Stack, Text, TextInput} from '@sanity/ui'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {ElementWithChangeBar} from '../ElementWithChangeBar'

/**
 * Vanilla-extract change-bar sentinel. TestWrapper supplies review-changes
 * context, layers, and studio i18n.
 */
export function ElementWithChangeBarStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <Stack gap={4}>
          <Stack gap={2}>
            <Text muted size={1}>
              changed
            </Text>
            <ElementWithChangeBar isChanged>
              <TextInput readOnly value="Changed field" />
            </ElementWithChangeBar>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1}>
              changed + focus
            </Text>
            <ElementWithChangeBar hasFocus isChanged>
              <TextInput readOnly value="Changed field with focus" />
            </ElementWithChangeBar>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1}>
              unchanged
            </Text>
            <ElementWithChangeBar isChanged={false}>
              <TextInput readOnly value="Unchanged field" />
            </ElementWithChangeBar>
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
