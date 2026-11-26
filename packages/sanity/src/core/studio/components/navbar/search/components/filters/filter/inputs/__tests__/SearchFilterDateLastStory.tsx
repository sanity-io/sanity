import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../../../../../test/browser/TestWrapper'
import {SearchProvider} from '../../../../../contexts/search/SearchProvider'
import {SearchFilterDateLastInput} from '../date/DateLast'

const NOOP = () => undefined

/**
 * Chromatic sentinel for the global-search "last N units" filter after the
 * ui5 Flex/Box migration. Number TextInput and unit Select still come from
 * Sanity UI; their radius and the fullscreen font-size bump sit in a Flex
 * gap TypeScript will not catch. Copy comes from the studio locale bundle
 * (no queries, no live dates).
 */
export function SearchFilterDateLastStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <SearchProvider>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                seven days
              </Text>
              <SearchFilterDateLastInput onChange={NOOP} value={{unit: 'day', unitValue: 7}} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                empty months
              </Text>
              <SearchFilterDateLastInput onChange={NOOP} value={{unit: 'month', unitValue: null}} />
            </VStack>
          </SearchProvider>
          <SearchProvider fullscreen>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                two years fullscreen
              </Text>
              <SearchFilterDateLastInput onChange={NOOP} value={{unit: 'year', unitValue: 2}} />
            </VStack>
          </SearchProvider>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
