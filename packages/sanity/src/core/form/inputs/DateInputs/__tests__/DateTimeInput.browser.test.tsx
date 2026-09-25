import {defineField, defineType, type SanityDocument} from '@sanity/types'
import {type ComponentProps} from 'react'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {DateTimeInput} from '../DateTimeInput'

const DOCUMENT: SanityDocument = {
  _id: 'datetime-input',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'datetime-input-rev',
  publishedAt: '2024-06-15T12:30:00.000Z',
}

function DateTimeSchemaInput(props: ComponentProps<typeof DateTimeInput>) {
  return <DateTimeInput {...props} />
}

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'datetime',
        name: 'publishedAt',
        title: 'Published at',
        options: {allowTimeZoneSwitch: false, displayTimeZone: 'Europe/Oslo'},
        components: {input: DateTimeSchemaInput},
      }),
    ],
  }),
]

function DateTimeInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

describe('DateTimeInput', () => {
  test('renders a datetime value in a fixed time zone', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<DateTimeInputHarness />)

    // Scope to the field: the time zone button's (closed, mounted) tooltip also renders the title
    // in an `<em>`, and Vitest 5's `getByText` resolves both, tripping the strict-mode check.
    await expect
      .element(page.getByTestId('field-publishedAt').getByText('Published at'))
      .toBeVisible()
    await settleChromaticEndState()
  })
})
