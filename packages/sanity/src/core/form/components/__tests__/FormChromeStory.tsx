import {type SanityClient} from '@sanity/client'
import {type ArraySchemaType, type FormNodeValidation} from '@sanity/types'
import {Card, Stack, Text, TextInput} from '@sanity/ui'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {IncompatibleItemType} from '../../members/array/IncompatibleItemType'
import {DuplicateKeysAlert} from '../../members/object/errors/DuplicateKeysAlert'
import {MissingKeysAlert} from '../../members/object/errors/MissingKeysAlert'
import {MixedArrayAlert} from '../../members/object/errors/MixedArrayAlert'
import {ErrorCard, FormBuilderInputErrorBoundary} from '../../studio/FormBuilderInputErrorBoundary'
import {FormField} from '../formField/FormField'
import {FormFieldHeaderText} from '../formField/FormFieldHeaderText'
import {FormFieldSet} from '../formField/FormFieldSet'

const ARRAY_SCHEMA_TYPE = {
  jsonType: 'array',
  name: 'fixtureItems',
  title: 'Related items',
  description: 'A fixture array used to show form error chrome.',
  of: [],
} as unknown as ArraySchemaType

const VALIDATION: FormNodeValidation[] = [
  {level: 'error', message: 'A title is required', path: ['title']},
]

const client = createMockSanityClient() as unknown as SanityClient

function FormChrome() {
  return (
    <Card padding={4} style={{maxWidth: 720}}>
      <Stack gap={6}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            field headers and nested fieldset
          </Text>
          <FormField title="Headline" description="Displayed on article cards." path={['headline']}>
            <TextInput defaultValue="A fixture headline" />
          </FormField>
          <FormFieldHeaderText
            deprecated={{reason: 'Use the summary field instead.'}}
            description="A compact description below the label."
            inputId="legacy-summary"
            suffix={<Text size={1}>Optional</Text>}
            title="Legacy summary"
            validation={VALIDATION}
          />
          <FormFieldSet
            collapsible
            columns={2}
            description="Two-column nested fields."
            inputId="metadata"
            level={1}
            path={['metadata']}
            schemaType={ARRAY_SCHEMA_TYPE}
            title="Metadata"
            validation={VALIDATION}
          >
            <TextInput defaultValue="First value" />
            <TextInput defaultValue="Second value" />
          </FormFieldSet>
        </Stack>

        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            incompatible array item
          </Text>
          <IncompatibleItemType
            value={{_type: 'retiredProduct', title: 'Archived fixture product'}}
          />
        </Stack>

        <Stack gap={4}>
          <Text muted size={1} weight="medium">
            array member errors
          </Text>
          <DuplicateKeysAlert
            error={{
              type: 'DUPLICATE_KEYS',
              schemaType: ARRAY_SCHEMA_TYPE,
              duplicates: [
                [0, 'duplicate-key'],
                [1, 'duplicate-key'],
              ],
            }}
            onChange={noop}
            path={['duplicateItems']}
          />
          <MissingKeysAlert
            error={{
              type: 'MISSING_KEYS',
              schemaType: ARRAY_SCHEMA_TYPE,
              value: [{}, {}],
            }}
            onChange={noop}
            path={['missingItems']}
          />
          <MixedArrayAlert
            error={{
              type: 'MIXED_ARRAY',
              schemaType: ARRAY_SCHEMA_TYPE,
              value: [{_type: 'fixtureItem', title: 'Valid fixture'}, 'Unexpected primitive'],
            }}
            onChange={noop}
            path={['mixedItems']}
          />
        </Stack>

        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            input error boundary
          </Text>
          <FormBuilderInputErrorBoundary>
            <Text size={1}>Healthy fixture input</Text>
          </FormBuilderInputErrorBoundary>
          <ErrorCard
            error={{
              message: 'The fixture input could not render',
              stack: 'Error: The fixture input could not render\n    at FixtureInput',
            }}
            onRetry={noop}
          />
        </Stack>
      </Stack>
    </Card>
  )
}

/**
 * Chromatic sentinel for form-field, member-error, and input-error chrome
 * touched by the misc form Stack migration. All values and error text are
 * fixed fixtures; the incompatible-item popover stays closed.
 */
export function FormChromeStory() {
  return (
    <TestWrapper client={client} schemaTypes={[]}>
      <FormChrome />
    </TestWrapper>
  )
}
