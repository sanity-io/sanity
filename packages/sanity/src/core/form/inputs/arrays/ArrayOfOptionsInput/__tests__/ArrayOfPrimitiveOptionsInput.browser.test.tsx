import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {type ComponentProps} from 'react'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {ArrayOfPrimitiveOptionsInput} from '../ArrayOfPrimitiveOptionsInput'

const DOCUMENT: SanityDocument = {
  _id: 'primitive-options-input',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'primitive-options-input-rev',
  categories: ['news'],
  sizes: ['small', 'large'],
}

function ArrayOfPrimitiveOptionsSchemaInput(
  props: ComponentProps<typeof ArrayOfPrimitiveOptionsInput>,
) {
  return <ArrayOfPrimitiveOptionsInput {...props} />
}

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'categories',
        title: 'Categories',
        of: [defineArrayMember({type: 'string'})],
        options: {
          list: [
            {title: 'News', value: 'news'},
            {title: 'Opinion', value: 'opinion'},
            {title: 'Reviews', value: 'reviews'},
          ],
        },
        components: {input: ArrayOfPrimitiveOptionsSchemaInput},
      }),
      defineField({
        type: 'array',
        name: 'sizes',
        title: 'Sizes',
        of: [defineArrayMember({type: 'string'})],
        options: {
          layout: 'grid',
          list: ['small', 'medium', 'large', 'extraLarge'],
        },
        components: {input: ArrayOfPrimitiveOptionsSchemaInput},
      }),
    ],
  }),
]

function ArrayOfPrimitiveOptionsInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

describe('array of primitive options input', () => {
  test('renders list and grid layouts and toggles an option', async () => {
    const {settleChromaticEndState, waitForDocumentState} = testHelpers()
    void render(<ArrayOfPrimitiveOptionsInputHarness />)

    const opinion = page.getByRole('checkbox', {name: 'Opinion'})
    await expect.element(opinion).not.toBeChecked()
    await expect.element(page.getByRole('checkbox', {name: 'Extra Large'})).toBeVisible()

    await opinion.click()
    await waitForDocumentState(
      (state) => JSON.stringify(state?.categories) === JSON.stringify(['news', 'opinion']),
    )

    await expect.element(opinion).toBeChecked()
    await expect.element(page.getByRole('checkbox', {name: 'News'})).toBeChecked()
    await settleChromaticEndState()
  })
})
