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

const FAILING_SOURCE_SCHEMA = [
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
        options: {
          source: () => {
            throw new Error('Title required')
          },
          isUnique: () => true,
        },
        components: {input: SlugSchemaInput},
      }),
    ],
  }),
]

function SlugInputHarness({
  schemaTypes = SCHEMA,
}: {
  schemaTypes?: ComponentProps<typeof TestWrapper>['schemaTypes']
}) {
  return (
    <TestWrapper schemaTypes={schemaTypes}>
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

  test('keeps the generate button height when slug generation fails', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<SlugInputHarness schemaTypes={FAILING_SOURCE_SCHEMA} />)

    const field = page.getByTestId('field-slug')
    const button = field.getByRole('button', {name: 'Generate'})
    await expect.element(button).toBeVisible()
    const heightBefore = button.element().getBoundingClientRect().height

    await button.click()
    await expect.element(field.getByText('Title required')).toBeVisible()

    const textInputHeight = field.getByRole('textbox').element().getBoundingClientRect().height
    const heightAfter = button.element().getBoundingClientRect().height
    expect(heightAfter).toBe(heightBefore)
    expect(heightAfter).toBe(textInputHeight)
    await settleChromaticEndState()
  })
})
