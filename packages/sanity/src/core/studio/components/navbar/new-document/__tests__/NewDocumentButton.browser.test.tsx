import {DocumentIcon} from '@sanity/icons/Document'
import {UserIcon} from '@sanity/icons/User'
import {defineField, defineType} from '@sanity/types'
import {BoundaryElementProvider, Flex} from '@sanity/ui'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {NewDocumentButton} from '../NewDocumentButton'
import {type NewDocumentOption} from '../types'

// The button drops options whose schema type is missing or deprecated, so the
// fixture options need matching document types in the mock workspace.
const SCHEMA_TYPES = [
  defineType({
    name: 'author',
    title: 'Author',
    type: 'document',
    icon: UserIcon,
    fields: [defineField({name: 'name', type: 'string'})],
  }),
  defineType({
    name: 'article',
    title: 'Article',
    type: 'document',
    icon: DocumentIcon,
    fields: [defineField({name: 'title', type: 'string'})],
  }),
]

const OPTIONS: NewDocumentOption[] = [
  {
    hasPermission: true,
    icon: UserIcon,
    id: 'author',
    schemaType: 'author',
    templateId: 'author',
    title: 'Author',
    type: 'initialValueTemplateItem',
  },
  {
    hasPermission: false,
    icon: DocumentIcon,
    id: 'article',
    schemaType: 'article',
    templateId: 'article',
    title: 'Article',
    type: 'initialValueTemplateItem',
  },
]

// The navbar has no pane above it, so its popovers measure `constrainSize`
// against the viewport in the studio. The wrapper's pane is only as tall as
// its content (one button) and would clamp the open popover to a few pixels.
// The `Flex` stands in for the navbar's own, so the popover's reference is the
// button rather than a full-width block; centering the button gives the 320px
// popover the room it has in the studio (where the logo and workspace menu sit
// to its left) rather than flipping it sideways at the viewport edge.
function NewDocumentButtonHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <BoundaryElementProvider element={window.document.body}>
        <Flex justify="center">
          <NewDocumentButton canCreateDocument loading={false} options={OPTIONS} />
        </Flex>
      </BoundaryElementProvider>
    </TestWrapper>
  )
}

/**
 * Visual coverage for the navbar's new-document popover: the selected trigger
 * button, the bordered search input in the popover header and the inline
 * option list with one permitted and one permission-less row.
 */
describe('NewDocumentButton', () => {
  test('opens the popover with the search input and the document type list', async () => {
    const {settleChromaticEndState} = testHelpers()

    await render(<NewDocumentButtonHarness />)

    const trigger = page.getByTestId('new-document-button')
    await expect.element(trigger).toBeEnabled()
    await userEvent.click(trigger)

    const searchInput = page.getByTestId('new-document-button-search-input')
    await expect.element(searchInput).toBeVisible()
    await expect.element(page.getByText('Author')).toBeVisible()
    await expect.element(page.getByText('Article')).toBeVisible()
    // `toBeVisible` passes for a popover clamped to a few pixels by `constrainSize`.
    await expect
      .poll(
        () => searchInput.element().closest('[data-ui="Popover"]')?.getBoundingClientRect().height,
      )
      .toBeGreaterThan(100)

    await settleChromaticEndState()
  })
})
