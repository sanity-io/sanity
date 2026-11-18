import {defineField, defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {isShown, testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type Variant} from '../../machines/selectionMachine'
import {type PendingDraft} from '../../utils/withPendingDraft'
import {DocumentGroupEntry} from '../DocumentGroupEntry'
import {DocumentGroupSet} from '../DocumentGroupSet'
import {PendingDraftEntry} from '../PendingDraftEntry'
import {VariantCheckbox} from '../VariantSet/VariantCheckbox'

const PUBLISHED_ID = 'pending-document'
const DOCUMENT_TYPE = 'author'
const SCHEMA_TYPES = [
  defineType({
    name: DOCUMENT_TYPE,
    type: 'document',
    fields: [defineField({name: 'name', type: 'string'})],
  }),
]
const NOOP = () => undefined

const GERMANY_DRAFT: Variant = {
  id: `versions.d-germany.${PUBLISHED_ID}`,
  name: 'Germany',
  document: {
    _id: `versions.d-germany.${PUBLISHED_ID}`,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: new Date().toISOString(),
    _type: DOCUMENT_TYPE,
    _system: {
      group: {_ref: PUBLISHED_ID, _weak: true},
      bundleId: 'drafts',
      variants: [{_key: 'germany', _ref: '_.variants.germany'}],
    },
  },
}

const DE_DE_DRAFT: PendingDraft = {
  id: `versions.d-de.${PUBLISHED_ID}`,
  variantId: '_.variants.de-de',
  name: 'de-DE',
}

/** The Draft set as the inventory draws it with a ghost row: the ghost row, then a real draft. */
function DraftSetHarness({draft = DE_DE_DRAFT}: {draft?: PendingDraft}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <DocumentGroupSet
        name="Draft"
        count={1}
        bundle={{type: 'perspective', perspective: 'drafts'}}
        selectionState="unchecked"
        onCheckedChange={NOOP}
        containsOpen
      >
        <PendingDraftEntry draft={draft} selectable />
        <DocumentGroupEntry
          variant={GERMANY_DRAFT}
          releases={new Map()}
          onPrimaryAction={NOOP}
          leading={
            <VariantCheckbox
              label="Select Germany"
              tabbable={false}
              checked={false}
              onChange={NOOP}
            />
          }
        />
      </DocumentGroupSet>
    </TestWrapper>
  )
}

const {settleChromaticEndState} = testHelpers()

// The tooltip's text is also the row's hidden description, so look for a copy that shows
const tooltipShown = () =>
  page
    .getByText('Edit the form to create this draft')
    .elements()
    .some((element) => isShown(element))

describe('PendingDraftEntry', () => {
  it('names the draft, says it is not created yet, and marks it open with no checkbox', async () => {
    await render(<DraftSetHarness />)

    const row = page.getByTestId('pending-draft-row')
    await expect.element(row.getByTestId('version-title')).toHaveTextContent('de-DE')
    await expect
      .element(row.getByTestId('version-secondary-line'))
      .toHaveTextContent('Not created yet')
    await expect
      .element(row.getByRole('button', {name: 'de-DE'}))
      .toHaveAttribute('aria-current', 'true')
    // Nothing to select, delete or compare: no checkbox, while the real draft keeps its own
    expect(row.element().querySelector('input[type="checkbox"]')).toBeNull()
    expect(document.querySelectorAll('input[type="checkbox"]').length).toBeGreaterThan(0)
    // A variant's ghost row carries the outline diamond
    await expect.element(row.getByTestId('variant-mark')).toBeInTheDocument()
    await settleChromaticEndState()
  })

  it('draws the open row as not there yet: a dashed outline on a pale background', async () => {
    await render(<DraftSetHarness />)
    await expect.element(page.getByTestId('pending-draft-row')).toBeVisible()

    const row = page.getByTestId('pending-draft-row').element()
    const style = getComputedStyle(row)
    expect(style.outlineStyle).toBe('dashed')
    // Not the strong open blue: the title keeps the row's own text colour
    const title = row.querySelector('[data-testid="version-title"]')!
    const germanyTitle = page
      .getByTestId('version-title')
      .elements()
      .find((element) => element.textContent === 'Germany')!
    expect(getComputedStyle(title).color).toBe(getComputedStyle(germanyTitle).color)
  })

  it('says how to create the draft in a tooltip, on hover and on keyboard focus', async () => {
    await render(<DraftSetHarness />)

    await userEvent.hover(page.getByTestId('pending-draft-row'))
    await expect.poll(tooltipShown).toBe(true)
    await userEvent.unhover(page.getByTestId('pending-draft-row'))

    page.getByRole('button', {name: 'de-DE'}).element().focus()
    await expect.poll(tooltipShown).toBe(true)
    await expect
      .element(page.getByRole('button', {name: 'de-DE'}))
      .toHaveAccessibleDescription('Not created yet. Edit the form to create this draft')
  })

  it('leaves the diamond off a Default ghost row', async () => {
    await render(<DraftSetHarness draft={{id: `drafts.${PUBLISHED_ID}`, name: 'Default'}} />)

    const row = page.getByTestId('pending-draft-row')
    await expect.element(row.getByTestId('version-title')).toHaveTextContent('Default')
    expect(row.element().querySelector('[data-testid="variant-mark"]')).toBeNull()
  })

  it('keeps a Draft set that holds only the ghost row in line with the other sets', async () => {
    await render(
      <TestWrapper schemaTypes={SCHEMA_TYPES}>
        <DocumentGroupSet
          name="Published"
          count={1}
          bundle={{type: 'perspective', perspective: 'published'}}
          selectionState="unchecked"
          onCheckedChange={NOOP}
        >
          <DocumentGroupEntry
            variant={GERMANY_DRAFT}
            releases={new Map()}
            onPrimaryAction={NOOP}
            leading={
              <VariantCheckbox
                label="Select Germany"
                tabbable={false}
                checked={false}
                onChange={NOOP}
              />
            }
          />
        </DocumentGroupSet>
        <DocumentGroupSet
          name="Draft"
          bundle={{type: 'perspective', perspective: 'drafts'}}
          selectionState="unchecked"
          onCheckedChange={NOOP}
          nothingToSelect
          containsOpen
        >
          <PendingDraftEntry draft={DE_DE_DRAFT} selectable />
        </DocumentGroupSet>
      </TestWrapper>,
    )

    await expect.element(page.getByTestId('pending-draft-row')).toBeVisible()
    const names = page.getByTestId('variant-set-name').elements()
    expect(names).toHaveLength(2)
    // The set names and the row titles start at the same x in both sets
    expect(names[1].getBoundingClientRect().left).toBe(names[0].getBoundingClientRect().left)
    const titles = page.getByTestId('version-title').elements()
    expect(titles[1].getBoundingClientRect().left).toBe(titles[0].getBoundingClientRect().left)
    // Nothing to select: the empty cell holds no checkbox
    const draftSet = names[1].closest('[data-variant-set]')!
    expect(draftSet.querySelector('header input[type="checkbox"]')).toBeNull()
    // The set exists only for the ghost row: one dashed outline goes around the header and the
    // row together, and neither draws its own
    expect(getComputedStyle(draftSet, '::after').borderTopStyle).toBe('dashed')
    expect(getComputedStyle(draftSet.querySelector('header')!).outlineStyle).toBe('none')
    expect(
      getComputedStyle(draftSet.querySelector('[data-testid="pending-draft-row"]')!).outlineStyle,
    ).toBe('none')
    // The set with a real version has no such outline
    const publishedSet = names[0].closest('[data-variant-set]')!
    expect(getComputedStyle(publishedSet, '::after').borderTopStyle).not.toBe('dashed')
  })
})
