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
function MenuStory({selected, withLeadingItem}: {selected?: string; withLeadingItem: boolean}) {
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
              items: matching.map((row) => (
                <MenuItem
                  icon={AddIcon}
                  key={row}
                  pressed={row === selected}
                  selected={row === selected}
                  text={row}
                />
              )),
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

describe('DocumentNavigationMenu: reopening a scrolled list', () => {
  const menu = () => page.getByTestId('pill-menu').element() as HTMLElement
  const list = () =>
    [...menu().querySelectorAll<HTMLElement>('*')].find(
      (element) => getComputedStyle(element).overflowY === 'auto',
    )!

  function geometry() {
    const field = fieldOf(menu()).getBoundingClientRect()
    const box = list().getBoundingClientRect()
    const rows = [...list().querySelectorAll('[data-ui="MenuItem"]')].map((row) =>
      row.getBoundingClientRect(),
    )
    const firstVisible = rows.find((row) => row.bottom > box.top + 0.5)!
    return {fieldBottom: field.bottom, firstVisibleTop: firstVisible.top, listBottom: box.bottom}
  }

  async function open() {
    await page.getByTestId('open-menu').click()
    await expect.element(page.getByTestId('pill-menu')).toBeVisible()
    await expectStable(() => `${list().scrollTop}|${JSON.stringify(geometry())}`)
  }

  async function close() {
    await userEvent.keyboard('{Escape}')
    await expect.element(page.getByTestId('pill-menu')).not.toBeVisible()
  }

  /** Keeps the list short enough to scroll, then leaves a row cut in half at its top. */
  function scrollToHalfRow() {
    list().style.maxHeight = '90px'
    const row = list().querySelector('[data-ui="MenuItem"]')!.getBoundingClientRect()
    list().scrollTop = row.height / 2
  }

  it('reopens at the top with nothing selected', async () => {
    void render(<MenuStory withLeadingItem />)
    await open()
    scrollToHalfRow()
    await close()
    await open()

    expect(list().scrollTop).toBe(0)
    const {fieldBottom, firstVisibleTop} = geometry()
    expect(Math.abs(firstVisibleTop - (fieldBottom + 8))).toBeLessThanOrEqual(1)
  })

  it('reopens with the selected row whole and no row half under the search field', async () => {
    // Not the last row: at the very end of the list, where it cannot scroll any further, the
    // top row may be cut (see `scrollToSelection` in `useMenuOverflow`)
    void render(<MenuStory selected="Bravo" withLeadingItem />)
    await open()
    scrollToHalfRow()
    await close()
    await open()

    const {fieldBottom, firstVisibleTop, listBottom} = geometry()
    expect(firstVisibleTop).toBeGreaterThanOrEqual(fieldBottom + 8 - 1)
    const selected = page.getByRole('menuitem', {name: 'Bravo'}).element().getBoundingClientRect()
    expect(selected.top).toBeGreaterThanOrEqual(fieldBottom + 8 - 1)
    expect(selected.bottom).toBeLessThanOrEqual(listBottom + 1)
  })
})
