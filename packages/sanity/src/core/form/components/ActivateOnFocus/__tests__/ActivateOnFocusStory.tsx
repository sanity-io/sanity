import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {ActivateOnFocus} from '../ActivateOnFocus'

const FIELD = (
  <Card border padding={4} radius={2} style={{minHeight: 120}}>
    <Text muted size={1} as="div" trim={true}>
      Portable text field
    </Text>
  </Card>
)

const REVEAL_OVERLAY = `
  [data-testid='activate-overlay-revealed'] [data-testid='activate-overlay'] > * {
    opacity: 1 !important;
  }
`

/**
 * Chromatic sentinel for the activate-on-focus overlay after the ui5 Text
 * migration. The overlay Card and prompt start at opacity 0 and only become
 * visible on hover or focus of the Flex host — Storybook play does not apply
 * those CSS states reliably, so the revealed row forces child opacity the way
 * the focused field looks. The prompt is a fixture (not the device-dependent
 * click/tap copy).
 */
export function ActivateOnFocusStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <style>{REVEAL_OVERLAY}</style>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              inactive
            </Text>
            <ActivateOnFocus isOverlayActive={false}>{FIELD}</ActivateOnFocus>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              overlay revealed
            </Text>
            <div data-testid="activate-overlay-revealed">
              <ActivateOnFocus isOverlayActive message="Click to activate">
                {FIELD}
              </ActivateOnFocus>
            </div>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
