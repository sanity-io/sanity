import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {FilterNoMatches} from '../FilterNoMatches'

/**
 * Chromatic sentinel for the perspective-menu empty-filter chrome: muted ui5
 * Text inside Box padding. Short and long queries pin wrapping of the
 * interpolated filter string. Copy is a locale fixture — no live search.
 */
export function FilterNoMatchesStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 320}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              short query
            </Text>
            <Card radius={3} shadow={2}>
              <FilterNoMatches filter="zzzz" />
            </Card>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              long query
            </Text>
            <Card radius={3} shadow={2}>
              <FilterNoMatches filter="Norwegian market with extra words" />
            </Card>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
