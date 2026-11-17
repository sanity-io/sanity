import {configure} from '@chromatic-com/vitest'
import {AddIcon} from '@sanity/icons/Add'
import {BoundaryElementProvider, Button} from '@sanity/ui'
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
      {/* The page, not the short test pane, bounds the popover, so it opens at its full height */}
      <BoundaryElementProvider element={document.documentElement}>
        <DocumentNavigationMenu
          button={<Button data-testid="open-menu" text="Open" />}
          filterPlaceholder="Search"
          filterQuery={filterQuery}
          // Every row of the pill menus has an icon, so every row reserves the icon slot
          leadingItems={
            showLeading ? (
              <MenuItem data-testid="leading-row" icon={AddIcon} text="Default" />
            ) : null
          }
          onFilterChange={setFilterQuery}
          sections={[
            {
              key: 'rows',
              label: 'Rows',
              items: matching.map((row) => <MenuItem icon={AddIcon} key={row} text={row} />),
            },
          ]}
          testId="pill-menu"
        />
      </BoundaryElementProvider>
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

describe('DocumentNavigationMenu: inset around the rows', () => {
  it('keeps the rows 8px from the sides and the last row 8px from the bottom', async () => {
    void render(<MenuStory withLeadingItem />)
    await page.getByTestId('open-menu').click()
    const menu = page.getByTestId('pill-menu')
    await expect.element(menu).toBeVisible()
    await expect.element(page.getByTestId('leading-row')).toBeVisible()

    const geometry = () => {
      const menuElement = menu.element()
      const rows = [...menuElement.querySelectorAll('[data-ui="MenuItem"]')]
      const first = rows[0].getBoundingClientRect()
      const last = rows[rows.length - 1]
      const box = menuElement.getBoundingClientRect()
      // The column inside the scroller that holds every row; its padding and the menu's own make
      // the space under the last row. Read from the column, not the menu's box, which the popover
      // may cut short to fit
      let column: Element | null = last
      while (column?.parentElement && getComputedStyle(column.parentElement).overflowY !== 'auto') {
        column = column.parentElement
      }
      if (!column?.parentElement) throw new Error('row column not found')
      const below =
        column.getBoundingClientRect().bottom -
        last.getBoundingClientRect().bottom +
        parseFloat(getComputedStyle(menuElement).paddingBottom)
      return {left: first.left - box.left, right: box.right - first.right, below}
    }
    await expectStable(() => JSON.stringify(geometry()))

    const {left, right, below} = geometry()
    expect(Math.abs(left - 8)).toBeLessThanOrEqual(1)
    expect(Math.abs(right - 8)).toBeLessThanOrEqual(1)
    expect(Math.abs(below - 8)).toBeLessThanOrEqual(1)
  })
})

/** The innermost element that holds exactly this text. */
function textOf(root: Element, text: string): Element {
  const match = [...root.querySelectorAll('*')].findLast(
    (element) => element.textContent === text && element.getBoundingClientRect().width > 0,
  )
  if (!match) throw new Error(`"${text}" not found`)
  return match
}

describe('DocumentNavigationMenu: section labels', () => {
  it("start where the rows' text starts, past the icon slot", async () => {
    void render(<MenuStory withLeadingItem />)
    await page.getByTestId('open-menu').click()
    const menu = page.getByTestId('pill-menu')
    await expect.element(menu).toBeVisible()
    const section = page.getByTestId('pill-menu-section-rows')
    await expect.element(section).toBeVisible()

    const offsets = () => {
      const box = menu.element().getBoundingClientRect()
      return {
        label: textOf(section.element(), 'Rows').getBoundingClientRect().left - box.left,
        rowText: textOf(menu.element(), 'Alpha').getBoundingClientRect().left - box.left,
        leadingText: textOf(menu.element(), 'Default').getBoundingClientRect().left - box.left,
      }
    }
    await expectStable(() => JSON.stringify(offsets()))

    const {label, rowText, leadingText} = offsets()
    expect(Math.abs(label - rowText)).toBeLessThanOrEqual(1)
    expect(Math.abs(rowText - leadingText)).toBeLessThanOrEqual(1)
    expect(Math.abs(label - 41)).toBeLessThanOrEqual(1)
  })
})
