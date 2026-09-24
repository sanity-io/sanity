import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {type ComponentProps} from 'react'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {GridArrayInput} from '../GridArrayInput'
import {IncompatibleItemType} from '../IncompatibleItemType'

function GridArraySchemaInput(props: ComponentProps<typeof GridArrayInput>) {
  return <GridArrayInput {...props} />
}

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'gridItems',
        title: 'Grid items',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'gridCard',
            fields: [defineField({type: 'string', name: 'title', title: 'Title'})],
          }),
        ],
        components: {input: GridArraySchemaInput},
      }),
    ],
  }),
]

function GridArrayInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm />
    </TestWrapper>
  )
}

function IncompatibleItemTypeHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <div style={{maxWidth: 180}}>
        <IncompatibleItemType value={{_type: 'legacyMarketingHero', title: 'Legacy hero'}} />
      </div>
    </TestWrapper>
  )
}

describe('grid array input', () => {
  test('renders an empty grid array', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<GridArrayInputHarness />)

    await expect.element(page.getByText('Grid items')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders an incompatible grid item', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<IncompatibleItemTypeHarness />)

    await expect.element(page.getByRole('button', {name: /legacyMarketingHero/})).toBeVisible()
    await settleChromaticEndState()
  })
})
