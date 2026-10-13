import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type NormalizedVariantConditionMap} from '../../../util/normalizeVariantConditions'
import {ConditionMappedRow} from '../ConditionMappedRow'

const AUDIENCE: NormalizedVariantConditionMap = {
  name: 'audience',
  title: 'Audience',
  description: 'Who sees this',
  values: [
    {value: 'loyal', title: 'Loyal customers'},
    {value: 'new', title: 'New visitors'},
  ],
}

const LOCALE: NormalizedVariantConditionMap = {
  name: 'locale',
  title: 'Locale',
  values: [{value: 'en-US', title: 'en-US'}],
}

const DEFINITIONS = [AUDIENCE, LOCALE]
const NO_USED_KEYS: ReadonlySet<string> = new Set()

/**
 * Chromatic sentinel for one mapped-condition row after the ui5 Flex/Box
 * migration. Empty / selected / key-error / value-error / remove-disabled
 * pair the two ConditionMenuButton triggers with a critical trash Button
 * and TextWithTone — a mix TypeScript will not catch. Labels come from
 * the variants locale bundle.
 */
export function ConditionMappedRowStory() {
  return (
    <TestWrapper i18nBundles={[variantsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 520}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              empty
            </Text>
            <ConditionMappedRow
              definitions={DEFINITIONS}
              disableRemove={false}
              onRemove={noop}
              onSelectKey={noop}
              onSelectValue={noop}
              selectedKey=""
              selectedValue=""
              usedKeys={NO_USED_KEYS}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              selected
            </Text>
            <ConditionMappedRow
              definitions={DEFINITIONS}
              disableRemove={false}
              onRemove={noop}
              onSelectKey={noop}
              onSelectValue={noop}
              selectedKey="audience"
              selectedValue="loyal"
              usedKeys={NO_USED_KEYS}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              key error
            </Text>
            <ConditionMappedRow
              definitions={DEFINITIONS}
              disableRemove={false}
              keyError="This condition is no longer configured"
              onRemove={noop}
              onSelectKey={noop}
              onSelectValue={noop}
              selectedKey="legacy"
              selectedValue=""
              usedKeys={NO_USED_KEYS}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              value error
            </Text>
            <ConditionMappedRow
              definitions={DEFINITIONS}
              disableRemove={false}
              onRemove={noop}
              onSelectKey={noop}
              onSelectValue={noop}
              selectedKey="audience"
              selectedValue="retired"
              usedKeys={NO_USED_KEYS}
              valueError="This value is no longer configured"
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              remove disabled
            </Text>
            <ConditionMappedRow
              definitions={DEFINITIONS}
              disableRemove
              onRemove={noop}
              onSelectKey={noop}
              onSelectValue={noop}
              selectedKey="locale"
              selectedValue="en-US"
              usedKeys={NO_USED_KEYS}
            />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
