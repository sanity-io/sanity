import {defineField, defineType, type SanityDocument} from '@sanity/types'
import {type ComponentProps} from 'react'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {SlugInput} from '../SlugInput'

const DOCUMENT: SanityDocument = {
  _id: 'slug-input',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'slug-input-rev',
  title: 'Visual regression fixtures',
  slug: {_type: 'slug', current: 'visual-regression-fixtures'},
}

function SlugSchemaInput(props: ComponentProps<typeof SlugInput>) {
  return <SlugInput {...props} />
}

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({type: 'string', name: 'title', title: 'Title'}),
      defineField({
        type: 'slug',
        name: 'slug',
        title: 'Slug',
        options: {source: 'title', isUnique: () => true},
        components: {input: SlugSchemaInput},
      }),
    ],
  }),
]

function SlugInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

describe('SlugInput', () => {
  test('renders the current slug', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<SlugInputHarness />)

    const field = page.getByTestId('field-slug')
    await expect.element(field.getByText('Slug', {exact: true})).toBeVisible()
    await expect.element(field.getByRole('textbox')).toHaveValue('visual-regression-fixtures')
    await settleChromaticEndState()
  })
})
