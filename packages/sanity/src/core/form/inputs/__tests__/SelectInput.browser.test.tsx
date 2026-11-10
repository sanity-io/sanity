import {defineField, defineType, type SanityDocument} from '@sanity/types'
import {type ComponentProps} from 'react'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {SelectInput} from '../SelectInput'

const DOCUMENT: SanityDocument = {
  _id: 'select-input',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'select-input-rev',
  status: 'review',
}

function SelectSchemaInput(props: ComponentProps<typeof SelectInput>) {
  return <SelectInput {...props} />
}

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'string',
        name: 'status',
        title: 'Status',
        options: {
          layout: 'radio',
          list: [
            {title: 'Draft', value: 'draft'},
            {title: 'In review', value: 'review'},
            {title: 'Published', value: 'published'},
          ],
        },
        components: {input: SelectSchemaInput},
      }),
    ],
  }),
]

function SelectInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

describe('SelectInput', () => {
  test('renders the selected radio option', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<SelectInputHarness />)

    await expect.element(page.getByText('In review')).toBeVisible()
    await settleChromaticEndState()
  })
})
