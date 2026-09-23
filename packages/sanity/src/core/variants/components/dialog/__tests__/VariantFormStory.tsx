import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type VariantConditionMap, type VariantConditions} from '../../../../config/types'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type EditableSystemVariant} from '../../../types'
import {VariantForm} from '../VariantForm'

const SCHEMA_TYPES: [] = []
const EMPTY_CONDITIONS: VariantConditionMap[] = []

const STORY_VARIANT: EditableSystemVariant = {
  _id: '_.variants.story',
  _type: 'system.variant',
  conditions: {},
  priority: 0,
  metadata: {
    title: '',
    description: [],
  },
}

function failingConditionsResolver(): never {
  throw new Error('cdp unavailable')
}

function VariantFormErrorHarness(props: {conditions: VariantConditions}) {
  return (
    <TestWrapper
      betaFeatures={{
        variants: {enabled: true, types: {variant: {conditions: props.conditions}}},
      }}
      i18nBundles={[variantsUsEnglishLocaleBundle]}
      schemaTypes={SCHEMA_TYPES}
    >
      <Card padding={4} style={{maxWidth: 480}}>
        <VariantForm
          onChange={noop}
          onConditionValidityChange={noop}
          onPriorityValidityChange={noop}
          value={STORY_VARIANT}
        />
      </Card>
    </TestWrapper>
  )
}

/**
 * Chromatic sentinel for the mapped-conditions error on the create/edit form
 * when `beta.variants.types.variant.conditions` is empty or all-invalid: critical copy,
 * no Retry. `useVariantConditions` first paints loading, so the CSF play
 * waits for the error before capture.
 */
export function InvalidVariantConditionsStory() {
  return <VariantFormErrorHarness conditions={EMPTY_CONDITIONS} />
}

/**
 * Chromatic sentinel for a retryable resolver failure on the same form:
 * load-error copy plus Retry. Same first-paint loading as the invalid-config
 * story; play waits for the error.
 */
export function FailedVariantConditionsStory() {
  return <VariantFormErrorHarness conditions={failingConditionsResolver} />
}
