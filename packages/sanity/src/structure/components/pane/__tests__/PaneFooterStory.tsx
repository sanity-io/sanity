import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {Button} from '../../../../ui-components/button/Button'
import {PaneFooter} from '../PaneFooter'

/**
 * Chromatic sentinel for the structure pane footer after the ui5 Box
 * migration and the stable `data-sanity-document-footer` hook. Sticky Layer
 * + Card + padding, including the extra-padded actions row, is invisible to
 * TypeScript. Copy is fixture only; TestWrapper already mounts a Pane so
 * collapsed/hidden is not exercised.
 */
export function PaneFooterStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              default padding
            </Text>
            <Card border radius={2} style={{minHeight: 80, position: 'relative'}}>
              <PaneFooter>
                <Button mode="ghost" text="Publish" tone="positive" />
              </PaneFooter>
            </Card>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              padded actions
            </Text>
            <Card border radius={2} style={{minHeight: 80, position: 'relative'}}>
              <PaneFooter padding={3}>
                <Button text="Publish" tone="positive" />
              </PaneFooter>
            </Card>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
