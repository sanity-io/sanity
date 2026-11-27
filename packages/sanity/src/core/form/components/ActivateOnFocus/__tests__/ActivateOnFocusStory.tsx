import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {ActivateOnFocus} from '../ActivateOnFocus'

function FieldStub({label}: {label: string}) {
  return (
    <Card border padding={4} radius={2} style={{minHeight: 96}}>
      <Text size={1} as="div" trim={true}>
        {label}
      </Text>
    </Card>
  )
}

/**
 * Chromatic sentinel for the Portable Text activate-on-focus overlay after the
 * ui5 Text migration. Fixture copy is passed in so Chromatic does not depend on
 * `ontouchstart` / `maxTouchPoints`. The overlay message is opacity 0 until
 * hover; the CSF `play` function hovers it before capture.
 */
export function ActivateOnFocusStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              overlay off
            </Text>
            <ActivateOnFocus isOverlayActive={false} onActivate={noop}>
              <FieldStub label="Portable text field" />
            </ActivateOnFocus>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              overlay on
            </Text>
            <ActivateOnFocus isOverlayActive message="Activate this field" onActivate={noop}>
              <FieldStub label="Portable text field" />
            </ActivateOnFocus>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
