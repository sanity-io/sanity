import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../../../../../test/browser/TestWrapper'
import {SearchProvider} from '../../../../../contexts/search/SearchProvider'
import {SearchFilterBooleanInput} from '../boolean/Boolean'
import {SearchFilterNumberInput} from '../number/Number'
import {SearchFilterStringInput} from '../string/String'

/**
 * Chromatic sentinel for global-search filter value inputs still on
 * `@sanity/ui` Select / TextInput: boolean true vs false, number and string
 * empty vs filled, and the fullscreen font-size bump. Number-range (two
 * TextInputs in a ui5 Flex) is covered separately. Copy comes from the studio
 * locale bundle (no queries, no dates).
 */
export function SearchFilterInputsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <SearchProvider>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                boolean true
              </Text>
              <SearchFilterBooleanInput onChange={noop} value />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                boolean false
              </Text>
              <SearchFilterBooleanInput onChange={noop} value={false} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                number empty
              </Text>
              <SearchFilterNumberInput onChange={noop} value={null} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                number filled
              </Text>
              <SearchFilterNumberInput onChange={noop} value={42} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                string empty
              </Text>
              <SearchFilterStringInput onChange={noop} value={null} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                string filled
              </Text>
              <SearchFilterStringInput onChange={noop} value="Acme" />
            </VStack>
          </SearchProvider>
          <SearchProvider fullscreen>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                boolean fullscreen
              </Text>
              <SearchFilterBooleanInput onChange={noop} value />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                number fullscreen
              </Text>
              <SearchFilterNumberInput onChange={noop} value={42} />
            </VStack>
          </SearchProvider>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
