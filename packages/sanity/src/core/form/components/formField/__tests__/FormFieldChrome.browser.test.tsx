import {type ArraySchemaType, type FormNodeValidation} from '@sanity/types'
import {Card, Stack, Text, TextInput} from '@sanity/ui'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {FormField} from '../FormField'
import {FormFieldHeaderText} from '../FormFieldHeaderText'
import {FormFieldSet} from '../FormFieldSet'

const ARRAY_SCHEMA_TYPE = {
  jsonType: 'array',
  name: 'fixtureItems',
  title: 'Related items',
  of: [],
} as unknown as ArraySchemaType

const VALIDATION: FormNodeValidation[] = [
  {level: 'error', message: 'A title is required', path: ['title']},
]

function FormFieldChromeHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 720}}>
        <Stack gap={5}>
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
      </Card>
    </TestWrapper>
  )
}

describe('form field chrome', () => {
  test('renders field, header, and nested fieldset states', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<FormFieldChromeHarness />)

    await expect.element(page.getByText('Legacy summary')).toBeVisible()
    await expect.element(page.getByText('Metadata')).toBeVisible()
    await settleChromaticEndState()
  })
})
