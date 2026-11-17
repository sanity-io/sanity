import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {type ComponentProps} from 'react'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {ArrayOfPrimitivesInput} from '../ArrayOfPrimitivesInput'

const DOCUMENT: SanityDocument = {
  _id: 'primitive-array-input',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'primitive-array-input-rev',
  primitiveItems: ['alpha', 'beta'],
}

function ArrayOfPrimitivesSchemaInput(props: ComponentProps<typeof ArrayOfPrimitivesInput>) {
  return <ArrayOfPrimitivesInput {...props} />
}

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'primitiveItems',
        title: 'Primitive items',
        of: [defineArrayMember({type: 'string'})],
        components: {input: ArrayOfPrimitivesSchemaInput},
      }),
    ],
  }),
]

function ArrayOfPrimitivesInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

describe('array of primitives input', () => {
  test('renders primitive array items', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ArrayOfPrimitivesInputHarness />)

    await expect.element(page.getByTestId('array-primitives-input')).toBeVisible()
    await settleChromaticEndState()
  })
})
