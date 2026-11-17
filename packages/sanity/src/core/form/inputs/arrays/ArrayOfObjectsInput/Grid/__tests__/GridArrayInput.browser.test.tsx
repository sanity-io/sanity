import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {type ComponentProps} from 'react'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {type ArrayOfObjectsInputProps} from '../../../../../types/inputProps'
import {ErrorItem} from '../ErrorItem'
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

const ERROR_ITEM_DOCUMENT: SanityDocument = {
  _id: 'grid-error-item',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'grid-error-item-rev',
  gridItems: [{_key: 'legacy-hero', _type: 'legacyMarketingHero', title: 'Legacy hero'}],
}

function GridErrorItemsInput(props: ArrayOfObjectsInputProps) {
  return (
    <div style={{maxWidth: 180}}>
      {props.members.map((member) =>
        member.kind === 'error' ? <ErrorItem key={member.key} member={member} /> : null,
      )}
    </div>
  )
}

const ERROR_ITEM_SCHEMA = [
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
        components: {input: GridErrorItemsInput},
      }),
    ],
  }),
]

function ErrorItemHarness() {
  return (
    <TestWrapper schemaTypes={ERROR_ITEM_SCHEMA}>
      <TestForm document={ERROR_ITEM_DOCUMENT} />
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

  test('renders an invalid grid item as an error cell', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ErrorItemHarness />)

    await expect.element(page.getByRole('button', {name: /legacyMarketingHero/})).toBeVisible()
    await settleChromaticEndState()
  })
})
