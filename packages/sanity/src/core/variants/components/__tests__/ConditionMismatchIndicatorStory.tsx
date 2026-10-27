import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {variantsUsEnglishLocaleBundle} from '../../i18n'
import {type ConditionMismatch} from '../../util/getVariantConditionMismatches'
import {ConditionMismatchIndicator} from '../ConditionMismatchIndicator'

const UNKNOWN_KEY: ConditionMismatch = {key: 'market', type: 'unknown-key', value: 'eu'}
const UNKNOWN_VALUE: ConditionMismatch = {key: 'market', type: 'unknown-value', value: 'xx'}

/**
 * Chromatic sentinel for the variants condition-mismatch icon. The critical
 * ToneIcon sits in a focusable Text host; the tooltip (ui-components, 400ms
 * delay) is opened from the CSF play function so Chromatic sees the i18n
 * message, not an empty icon. Copy comes from the variants locale bundle.
 */
export function ConditionMismatchIndicatorStory() {
  return (
    <TestWrapper i18nBundles={[variantsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420, minHeight: 220, paddingTop: 72}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              unknown key
            </Text>
            <ConditionMismatchIndicator mismatches={[UNKNOWN_KEY]} testId="mismatch-unknown-key" />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              unknown value
            </Text>
            <ConditionMismatchIndicator
              mismatches={[UNKNOWN_VALUE]}
              testId="mismatch-unknown-value"
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              multiple
            </Text>
            <ConditionMismatchIndicator
              mismatches={[UNKNOWN_KEY, UNKNOWN_VALUE]}
              testId="mismatch-multiple"
            />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
