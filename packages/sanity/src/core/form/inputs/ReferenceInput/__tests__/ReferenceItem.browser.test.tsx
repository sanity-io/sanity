import {takeSnapshot} from '@chromatic-com/vitest'
import {
  defineArrayMember,
  defineField,
  defineType,
  type ReferenceSchemaType,
  type ReferenceValue,
  type SanityDocument,
} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {isShown, testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type ObjectItem, type ObjectItemProps} from '../../../types/itemProps'
import {ReferenceItem} from '../ReferenceItem'

// The form picks `ReferenceItem` for reference array members on its own
// (`defaultResolveItemComponent`); routing the member through `components.item`
// renders that same component with the form's real item props, so this file is
// where the item's chrome (row layout, context menu, nested search input) is
// archived.
function DefaultReferenceItem(props: ObjectItemProps<ReferenceValue & ObjectItem>) {
  return <ReferenceItem {...props} schemaType={props.schemaType as ReferenceSchemaType} />
}

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'sections',
        title: 'Sections',
        of: [
          defineArrayMember({
            type: 'reference',
            name: 'sectionRef',
            title: 'Section',
            to: [{type: 'sectionDoc'}],
            components: {item: DefaultReferenceItem},
          }),
        ],
      }),
    ],
  }),
  defineType({
    type: 'document',
    name: 'sectionDoc',
    title: 'Section',
    fields: [defineField({type: 'string', name: 'title', title: 'Title'})],
  }),
]

// An item without a `_ref` renders in its editing state (the nested reference
// search input), which needs no reference metadata and so nothing from the
// mock client.
const DOCUMENT: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: '123',
  sections: [{_key: 'r0', _type: 'sectionRef'}],
}

function ReferenceItemHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

describe('reference array item', () => {
  it('renders an empty item in its editing state and opens the item menu', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ReferenceItemHarness />)

    const $field = page.getByTestId('field-sections')
    await expect.element($field.getByTestId('autocomplete')).toBeVisible()

    const menuButton = $field.element().querySelector('[id$="-menuButton"]')
    expect(menuButton).not.toBeNull()
    await page.elementLocator(menuButton!).click()

    const $menu = page.getByRole('menu')
    await expect.element($menu.getByText('Remove', {exact: true})).toBeVisible()
    await expect.element($menu.getByText('Replace', {exact: true})).toBeVisible()
    await expect.element($menu.getByText('Add item after', {exact: true})).toBeVisible()
    await takeSnapshot('item-menu-open')

    // Closed `@sanity/ui` menus stay mounted (hidden by `<Activity>`), so check
    // visibility rather than presence.
    const menuElement = $menu.element()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => isShown(menuElement), {timeout: 5_000}).toBe(false)
    await settleChromaticEndState()
  })
})
