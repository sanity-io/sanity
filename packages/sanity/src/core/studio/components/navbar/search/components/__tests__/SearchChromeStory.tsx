import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {SearchProvider} from '../../contexts/search/SearchProvider'
import {CustomTextInput} from '../common/CustomTextInput'
import {CustomTextInputBox} from '../common/CustomTextInputBox'
import {DateIncludeTimeFooter} from '../filters/filter/inputs/date/dateIncludeTimeFooter/DateIncludeTimeFooter'
import {Instructions} from '../Instructions'
import {NoResults} from '../NoResults'
import {SearchHeader} from '../SearchHeader'

const NOOP = () => undefined

/**
 * Chromatic sentinel for the post-migration ui5 search chrome: the empty-state
 * instructions row (icon + muted copy), the no-results message (two centered
 * muted lines whose Stack padding becomes ui5 Flex padding), the calendar
 * include-time footer (label + switch), the styled TextInput host (clear-button
 * scale + disabled fill), and the compact vs fullscreen SearchHeader. Flex
 * alignment against muted Text/Switch/TextInput is a mix TypeScript will not
 * catch. Copy comes from the studio locale bundle (no live queries, no dates).
 */
export function SearchChromeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              instructions
            </Text>
            <Instructions />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              no results
            </Text>
            <NoResults />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              include time off
            </Text>
            <DateIncludeTimeFooter onChange={NOOP} value={false} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              include time on
            </Text>
            <DateIncludeTimeFooter onChange={NOOP} value />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              text input empty
            </Text>
            <CustomTextInput onChange={NOOP} placeholder="Search" value="" />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              text input filled
            </Text>
            <CustomTextInput
              clearButton
              onChange={NOOP}
              onClear={NOOP}
              placeholder="Search"
              value="Acme"
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              text input fullscreen host
            </Text>
            <CustomTextInputBox $background $smallClearButton>
              <CustomTextInput
                $background
                $smallClearButton
                border={false}
                clearButton
                fontSize={2}
                onChange={NOOP}
                onClear={NOOP}
                placeholder="Search"
                radius={2}
                value="Acme"
              />
            </CustomTextInputBox>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              header
            </Text>
            <SearchProvider>
              <SearchHeader />
            </SearchProvider>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              header fullscreen
            </Text>
            <SearchProvider fullscreen>
              <SearchHeader onClose={NOOP} />
            </SearchProvider>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
