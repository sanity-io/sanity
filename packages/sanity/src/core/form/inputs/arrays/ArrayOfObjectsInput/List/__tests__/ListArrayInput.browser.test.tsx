import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {type ComponentProps} from 'react'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {ListArrayInput} from '../ListArrayInput'

function ListArraySchemaInput(props: ComponentProps<typeof ListArrayInput>) {
  return <ListArrayInput {...props} />
}

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'listItems',
        title: 'List items',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'listCard',
            fields: [defineField({type: 'string', name: 'title', title: 'Title'})],
          }),
        ],
        components: {input: ListArraySchemaInput},
      }),
    ],
  }),
]

function ListArrayInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm />
    </TestWrapper>
  )
}

// More items than the default limit of four, so the array renders collapsed.
const LONG_DOCUMENT: SanityDocument = {
  _id: 'list-array-input-long',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'list-array-input-long-rev',
  listItems: Array.from({length: 7}, (_, index) => ({
    _key: `item-${index}`,
    _type: 'listCard',
    title: `List card ${index + 1}`,
  })),
}

function LongListArrayInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm document={LONG_DOCUMENT} />
    </TestWrapper>
  )
}

describe('list array input', () => {
  test('renders an empty list array', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ListArrayInputHarness />)

    await expect.element(page.getByText('List items')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders a long list array collapsed', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<LongListArrayInputHarness />)

    await expect.element(page.getByText('List card 4')).toBeVisible()
    await expect.element(page.getByText('List card 5')).not.toBeInTheDocument()
    await expect.element(page.getByRole('button', {name: /Show all 7 items/})).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders a long list array expanded', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<LongListArrayInputHarness />)

    await page.getByRole('button', {name: /Show all 7 items/}).click()

    await expect.element(page.getByText('List card 7')).toBeVisible()
    await expect.element(page.getByRole('button', {name: /Show fewer items/})).toBeVisible()
    await settleChromaticEndState()
  })
})
