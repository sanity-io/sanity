import {takeSnapshot} from '@chromatic-com/vitest'
import {useEffect, useRef} from 'react'
import {defineField, defineType} from 'sanity'
import {Box} from 'ui5'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {expectStable, testHelpers} from '../../../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../../../test/browser/TestWrapper'
import {useSchema} from '../../../../../../../hooks/useSchema'
import {SearchProvider} from '../../../contexts/search/SearchProvider'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {filterDefinitions} from '../../../definitions/defaultFilters'
import {type SearchFieldDefinition} from '../../../definitions/fields'
import {type SearchFilterFieldDefinition} from '../../../definitions/filters'
import {AddFilterPopoverContent} from '../addFilter/AddFilterPopoverContent'
import {FilterTooltip} from '../addFilter/items/FilterTooltip'
import {DocumentTypesPopoverContent} from '../documentTypes/DocumentTypesPopoverContent'

const NOOP = () => undefined

function VirtualListHeight() {
  return (
    <style>
      {`div:has(> [aria-label="Filters"]),
        div:has(> [aria-label="Filter"]),
        div:has(> [aria-label="Document types"]) { height: 280px; }`}
    </style>
  )
}

const schemaTypes = [
  defineType({
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [
      defineField({name: 'name', title: 'Name', type: 'string'}),
      defineField({
        name: 'title',
        title: 'Title',
        type: 'string',
        description: 'The display title',
      }),
    ],
  }),
  defineType({
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [
      defineField({
        name: 'title',
        title: 'Title',
        type: 'string',
        description: 'The display title',
      }),
    ],
  }),
]

const foundStringFilter = filterDefinitions.find((definition) => definition.name === 'string')
if (!foundStringFilter || foundStringFilter.type !== 'field') {
  throw new Error('Expected the built-in string search filter')
}
const stringFilter: SearchFilterFieldDefinition = foundStringFilter

const titleField: SearchFieldDefinition = {
  documentTypes: ['author', 'article'],
  fieldPath: 'title',
  filterName: 'string',
  id: 'string-title-Title',
  name: 'title',
  title: 'Title',
  titlePath: ['Title'],
  type: 'string',
}

function AddFilterMenu() {
  return (
    <SearchProvider>
      <AddFilterPopoverContent onClose={NOOP} />
    </SearchProvider>
  )
}

function SelectedDocumentTypes() {
  const schema = useSchema()
  const {dispatch, state} = useSearchState()
  const author = schema.get('author')
  const didSelect = useRef(false)
  const selected = state.terms.types.some((type) => type.name === 'author')

  useEffect(() => {
    if (!author || didSelect.current) return
    didSelect.current = true
    dispatch({schemaType: author, type: 'TERMS_TYPE_ADD'})
  }, [author, dispatch])

  if (!selected || !author) return null
  return <DocumentTypesPopoverContent />
}

function TitleFilterTooltip() {
  return (
    <SearchProvider>
      <FilterTooltip
        fieldDefinition={titleField}
        filterDefinition={{
          description: 'Matches the exact title text',
          fieldType: stringFilter.fieldType,
          icon: stringFilter.icon,
          name: stringFilter.name,
          operators: stringFilter.operators,
          type: 'field',
        }}
        visible
      >
        <Box padding={3}>
          <button type="button">Title field</button>
        </Box>
      </FilterTooltip>
    </SearchProvider>
  )
}

/**
 * Chromatic sentinel for the add-filter menu, the document-type menu
 * (selected header plus clear), and the filter tooltip (field name,
 * description, document types). Fixture schema only.
 */
function FilterMenusHarness() {
  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <div style={{display: 'flex', alignItems: 'flex-start', gap: 24}}>
        <VirtualListHeight />
        <AddFilterMenu />
        <SearchProvider>
          <SelectedDocumentTypes />
        </SearchProvider>
        <TitleFilterTooltip />
      </div>
    </TestWrapper>
  )
}

function EmptyFilterMenusHarness() {
  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <div style={{display: 'flex', alignItems: 'flex-start', gap: 24}}>
        <VirtualListHeight />
        <AddFilterMenu />
        <SearchProvider>
          <DocumentTypesPopoverContent />
        </SearchProvider>
      </div>
    </TestWrapper>
  )
}

async function blur(locator: {element: () => Element}) {
  const element = locator.element()
  if (element instanceof HTMLElement) element.blur()
}

describe('search filter popovers', () => {
  it('shows filter and document type menus, and the title field tooltip', async () => {
    const {settleChromaticEndState} = testHelpers()
    await render(<FilterMenusHarness />)

    await expect.element(page.getByText('All fields', {exact: true})).toBeVisible()
    await expect.element(page.getByText('Name', {exact: true})).toBeVisible()
    await expect.element(page.getByText('Selected', {exact: true})).toBeVisible()
    await expect
      .element(page.getByRole('button', {name: 'Clear checked filters', exact: true}))
      .toBeVisible()

    await blur(page.getByRole('combobox', {name: 'Filter by title'}))
    await blur(page.getByRole('combobox', {name: 'Filter by document type'}))

    const trigger = page.getByRole('button', {name: 'Title field', exact: true})
    await userEvent.hover(trigger)
    // Closed tooltip copies stay mounted, so a text query matches more than one node.
    const fieldName = page.getByText('Field name', {exact: true})
    await expect
      .poll(() => fieldName.elements().some((element) => element.checkVisibility()))
      .toBe(true)
    const openTooltip = fieldName
      .elements()
      .find((element) => element.checkVisibility())
      ?.closest('[data-ui="Tooltip"]')
    expect(openTooltip?.textContent).toContain('The display title')
    expect(openTooltip?.textContent).toContain('Article, Author')
    expect(openTooltip?.textContent).toContain('Matches the exact title text')

    await expectStable(() => openTooltip?.getBoundingClientRect().x ?? 0)
    await takeSnapshot('filter tooltip')

    await settleChromaticEndState()
  })

  it('shows the no-matches copy for filters and document types', async () => {
    const {settleChromaticEndState} = testHelpers()
    await render(<EmptyFilterMenusHarness />)

    const filterInput = page.getByRole('combobox', {name: 'Filter by title'})
    const typeInput = page.getByRole('combobox', {name: 'Filter by document type'})
    await expect.element(filterInput).toBeVisible()
    await expect.element(typeInput).toBeVisible()

    await userEvent.fill(filterInput, 'zzzz-no-match')
    await userEvent.fill(typeInput, 'zzzz-no-type')

    await expect
      .element(page.getByText('No matches for zzzz-no-match', {exact: true}))
      .toBeVisible()
    await expect.element(page.getByText('No matches for zzzz-no-type', {exact: true})).toBeVisible()

    await blur(filterInput)
    await blur(typeInput)
    await settleChromaticEndState()
  })
})
