import {defineArrayMember, defineField, defineType} from '@sanity/types'
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

describe('list array input', () => {
  test('renders an empty list array', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ListArrayInputHarness />)

    await expect.element(page.getByText('List items')).toBeVisible()
    await settleChromaticEndState()
  })
})
