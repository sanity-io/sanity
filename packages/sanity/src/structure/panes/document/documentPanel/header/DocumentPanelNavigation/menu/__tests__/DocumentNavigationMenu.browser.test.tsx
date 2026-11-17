import {configure} from '@chromatic-com/vitest'
import {Button} from '@sanity/ui'
import {useState} from 'react'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {expectStable} from '../../../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../../../test/browser/TestWrapper'
import {MenuItem} from '../../../../../../../../ui-components/menuItem/MenuItem'
import {DocumentNavigationMenu} from '../DocumentNavigationMenu'

// The open menu is a measurement, not a visual state worth archiving.
configure({disableAutoSnapshot: true})

const ROWS = ['Alpha', 'Bravo', 'Charlie']

/** The Variants pill leads with a row; the Releases pill starts with a section. */
function MenuStory({withLeadingItem}: {withLeadingItem: boolean}) {
  const [filterQuery, setFilterQuery] = useState('')
  const matching = ROWS.filter((row) => row.toLowerCase().includes(filterQuery.toLowerCase()))
  const showLeading = withLeadingItem && 'default'.includes(filterQuery.toLowerCase())
  return (
    <TestWrapper schemaTypes={[]}>
      <DocumentNavigationMenu
        button={<Button data-testid="open-menu" text="Open" />}
        filterPlaceholder="Search"
        filterQuery={filterQuery}
        leadingItems={showLeading ? <MenuItem data-testid="leading-row" text="Default" /> : null}
        onFilterChange={setFilterQuery}
        sections={[
          {
            key: 'rows',
            label: 'Rows',
            items: matching.map((row) => <MenuItem key={row} text={row} />),
          },
        ]}
        testId="pill-menu"
      />
    </TestWrapper>
  )
}

const gapBetween = (above: Element, below: Element) =>
  below.getBoundingClientRect().top - above.getBoundingClientRect().bottom

/** The search field's visible box: the text input's root, not the bare `input` inside it. */
function fieldOf(menu: Element): Element {
  const input = menu.querySelector('input')
  if (!input) throw new Error('search field not found')
  return input.closest('[data-ui="TextInput"]') ?? input
}

async function expectGap(above: () => Element, below: () => Element) {
  await expectStable(() => String(gapBetween(above(), below())))
  // 8px (space 2), the inset used for everything inside the menu
  expect(Math.abs(gapBetween(above(), below()) - 8)).toBeLessThanOrEqual(1)
}

describe('DocumentNavigationMenu: gap below the search field', () => {
  it.each([
    {name: 'a leading row (Variants pill)', withLeadingItem: true, first: 'leading-row'},
    {name: 'a section (Releases pill)', withLeadingItem: false, first: 'pill-menu-section-rows'},
  ])('is 8px to $name and to the no-matches message', async ({withLeadingItem, first}) => {
    void render(<MenuStory withLeadingItem={withLeadingItem} />)
    await page.getByTestId('open-menu').click()
    const menu = page.getByTestId('pill-menu')
    await expect.element(menu).toBeVisible()
    const firstRow = page.getByTestId(first)
    await expect.element(firstRow).toBeVisible()

    await expectGap(
      () => fieldOf(menu.element()),
      () => firstRow.element(),
    )

    const input = menu.element().querySelector('input')
    if (!input) throw new Error('search field not found')
    await userEvent.type(input, 'zzz-no-match')
    const noMatches = page.getByTestId('pill-menu-no-matches')
    await expect.element(noMatches).toBeVisible()
    await expectGap(
      () => fieldOf(menu.element()),
      () => noMatches.element(),
    )
  })
})
