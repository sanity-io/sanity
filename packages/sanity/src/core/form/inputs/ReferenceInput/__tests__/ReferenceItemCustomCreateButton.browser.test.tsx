import {defineArrayMember, defineField, defineType, type ReferenceValue} from '@sanity/types'
import {useCallback} from 'react'
import {Box, Flex} from 'ui5'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {Button} from '../../../../../ui-components/button/Button'
import {set, setIfMissing} from '../../../patch/patch'
import {type ObjectItem, type ObjectItemProps} from '../../../types/itemProps'

const CREATED_SECTION_ID = 'deterministic-section-id'

/**
 * Mirrors a common studio customization: a custom item component for reference
 * items in arrays which renders a "Create new" action (assigning a
 * deterministic document ID) next to the default reference input.
 */
function CustomReferenceItem(props: ObjectItemProps<ReferenceValue & ObjectItem>) {
  const {inputProps, schemaType, value} = props
  const {onChange} = inputProps

  const handleCreate = useCallback(() => {
    onChange([
      setIfMissing({}),
      set(schemaType.name, ['_type']),
      set(CREATED_SECTION_ID, ['_ref']),
      set(true, ['_weak']),
    ])
  }, [onChange, schemaType.name])

  return (
    <Flex alignItems="center" data-testid="custom-reference-item" gap={3} paddingRight={3}>
      <Box flexBasis="0%" flexGrow={1}>
        {props.renderDefault(props)}
      </Box>
      {value?._ref ? null : (
        <Button
          data-testid="custom-create-new-button"
          mode="ghost"
          onClick={handleCreate}
          text="Create new"
        />
      )}
    </Flex>
  )
}

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'string',
        name: 'title',
        title: 'Title',
      }),
      defineField({
        type: 'array',
        name: 'sections',
        title: 'Sections',
        of: [
          defineArrayMember({
            type: 'reference',
            name: 'sectionRef',
            to: [{type: 'sectionDoc'}],
            components: {item: CustomReferenceItem},
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

function ReferenceItemCustomCreateButtonHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm />
    </TestWrapper>
  )
}

// Regression tests for custom "Create new" actions rendered by custom
// item/input components next to the default reference input in arrays.
//
// When an empty reference item is added to an array, its search input is
// focused, and mousedowns outside the input clear (remove) the empty item.
// Custom UI rendered around the default input belongs to the same array item
// and must not count as "outside": clearing on mousedown unmounts the custom
// UI before its click handlers run, breaking custom create flows.
describe('reference array item with a custom create button', () => {
  it('clicking the custom create button completes the create flow instead of removing the item', async () => {
    const {waitForDocumentState} = testHelpers()
    void render(<ReferenceItemCustomCreateButtonHarness />)

    // Add an empty reference item to the array. Focus moves to its search input.
    await page.getByTestId('add-single-object-button').click()
    await expect.element(page.getByTestId('custom-create-new-button')).toBeVisible()

    // Click the custom "Create new" button rendered next to the default input.
    await page.getByTestId('custom-create-new-button').click()

    // The item must still be there, now referencing the created document.
    await waitForDocumentState((state) => state?.sections?.[0]?._ref === CREATED_SECTION_ID)
    await expect.element(page.getByTestId('custom-reference-item')).toBeVisible()
  })

  it('a mousedown on the custom item wrapper (just missing the button) keeps the item', async () => {
    const {waitForDocumentState} = testHelpers()
    void render(<ReferenceItemCustomCreateButtonHarness />)

    await page.getByTestId('add-single-object-button').click()
    await expect.element(page.getByTestId('custom-create-new-button')).toBeVisible()

    // Simulate a click that misses the button by a few pixels and lands on the
    // custom wrapper, which sits around the default input.
    page
      .getByTestId('custom-reference-item')
      .element()
      .dispatchEvent(new MouseEvent('mousedown', {bubbles: true, cancelable: true}))

    // Give a potential (faulty) clear a chance to remove the item before asserting.
    await new Promise((resolve) => setTimeout(resolve, 250))
    await expect.element(page.getByTestId('custom-create-new-button')).toBeVisible()

    // The create flow still works afterwards.
    await page.getByTestId('custom-create-new-button').click()
    await waitForDocumentState((state) => state?.sections?.[0]?._ref === CREATED_SECTION_ID)
  })

  it('clicking outside the array item still clears the empty item', async () => {
    const {waitForDocumentState} = testHelpers()
    void render(<ReferenceItemCustomCreateButtonHarness />)

    await page.getByTestId('add-single-object-button').click()
    await expect.element(page.getByTestId('custom-create-new-button')).toBeVisible()

    // Click a field outside the array item.
    await page.getByTestId('field-title').getByRole('textbox').click()

    // The empty item is removed.
    await waitForDocumentState((state) => (state?.sections ?? []).length === 0)
  })
})
