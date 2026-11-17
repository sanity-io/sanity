import {configure} from '@chromatic-com/vitest'
import {DocumentIcon} from '@sanity/icons/Document'
import {BoundaryElementProvider} from '@sanity/ui'
import {useState} from 'react'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {expectStable} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {CreateVariantPicker} from '../CreateVariantPicker'

// The open menu is a measurement, not a visual state worth archiving.
configure({disableAutoSnapshot: true})

const OPTIONS = ['German', 'Swedish', 'Norwegian'].map((text) => ({
  key: text,
  text,
  icon: DocumentIcon,
  // What the select shows once the option is chosen
  selectIcon: <DocumentIcon />,
}))

function PickerHarness() {
  const [value, setValue] = useState<string | undefined>()
  return (
    <TestWrapper schemaTypes={[]}>
      {/* The page, not the short test pane, bounds the popover, so it opens at its full height */}
      <BoundaryElementProvider element={document.documentElement}>
        <div style={{width: 320}}>
          <CreateVariantPicker
            disabled={false}
            emptyIcon={null}
            label="Release"
            onChange={setValue}
            options={OPTIONS}
            testId="picker"
            value={OPTIONS.find((option) => option.key === value)}
          />
        </div>
      </BoundaryElementProvider>
    </TestWrapper>
  )
}

describe('CreateVariantPicker menu', () => {
  it('puts the first row 8px below the search field, 8px from the sides, the last 8px from the bottom', async () => {
    void render(<PickerHarness />)
    const field = page.getByTestId('picker-field')
    await expect.element(field).toBeVisible()
    await field.getByRole('button').click()
    const menu = page.getByTestId('picker')
    await expect.element(menu).toBeVisible()

    const geometry = () => {
      const menuElement = menu.element()
      const input = menuElement.querySelector('input')
      const search = input?.closest('[data-ui="TextInput"]') ?? input
      if (!search) throw new Error('search field not found')
      const rows = [...menuElement.querySelectorAll('[data-ui="MenuItem"]')]
      const first = rows[0].getBoundingClientRect()
      const last = rows[rows.length - 1]
      const box = menuElement.getBoundingClientRect()
      // The column inside the scroller that holds every row; its padding and the menu's own make
      // the space under the last row
      let column: Element | null = last
      while (column?.parentElement && getComputedStyle(column.parentElement).overflowY !== 'auto') {
        column = column.parentElement
      }
      if (!column) throw new Error('row column not found')
      return {
        searchGap: first.top - search.getBoundingClientRect().bottom,
        left: first.left - box.left,
        right: box.right - first.right,
        below:
          column.getBoundingClientRect().bottom -
          last.getBoundingClientRect().bottom +
          parseFloat(getComputedStyle(menuElement).paddingBottom),
      }
    }
    await expectStable(() => JSON.stringify(geometry()))

    const {searchGap, left, right, below} = geometry()
    expect(Math.abs(searchGap - 8)).toBeLessThanOrEqual(1)
    expect(Math.abs(left - 8)).toBeLessThanOrEqual(1)
    expect(Math.abs(right - 8)).toBeLessThanOrEqual(1)
    expect(Math.abs(below - 8)).toBeLessThanOrEqual(1)
  })
})

describe('CreateVariantPicker menu: reopening a scrolled list', () => {
  const menu = () => page.getByTestId('picker').element() as HTMLElement
  const list = () =>
    [...menu().querySelectorAll<HTMLElement>('*')].find(
      (element) => getComputedStyle(element).overflowY === 'auto',
    )!

  function geometry() {
    const field = menu().querySelector('[data-ui="TextInput"]')!.getBoundingClientRect()
    const box = list().getBoundingClientRect()
    const rows = [...list().querySelectorAll('[data-ui="MenuItem"]')].map((row) =>
      row.getBoundingClientRect(),
    )
    const firstVisible = rows.find((row) => row.bottom > box.top + 0.5)!
    return {fieldBottom: field.bottom, firstVisibleTop: firstVisible.top, listBottom: box.bottom}
  }

  async function open() {
    await page.getByTestId('picker-field').getByRole('button').click()
    await expect.element(page.getByTestId('picker')).toBeVisible()
    await expectStable(() => `${list().scrollTop}|${JSON.stringify(geometry())}`)
  }

  async function close() {
    await userEvent.keyboard('{Escape}')
    await expect.element(page.getByTestId('picker')).not.toBeVisible()
  }

  /** Keeps the list short enough to scroll, then leaves a row cut in half at its top. */
  function scrollToHalfRow() {
    list().style.maxHeight = '80px'
    const row = list().querySelector('[data-ui="MenuItem"]')!.getBoundingClientRect()
    list().scrollTop = row.height / 2
  }

  it('reopens at the top with nothing selected', async () => {
    void render(<PickerHarness />)
    await open()
    scrollToHalfRow()
    await close()
    await open()

    expect(list().scrollTop).toBe(0)
    const {fieldBottom, firstVisibleTop} = geometry()
    expect(Math.abs(firstVisibleTop - (fieldBottom + 8))).toBeLessThanOrEqual(1)
  })

  it('reopens with the selected option whole and no row half under the search field', async () => {
    void render(<PickerHarness />)
    await open()
    await page.getByRole('menuitemradio', {name: 'Norwegian'}).click()
    await expect.element(page.getByTestId('picker')).not.toBeVisible()
    await open()
    scrollToHalfRow()
    await close()
    await open()

    const {fieldBottom, firstVisibleTop, listBottom} = geometry()
    expect(firstVisibleTop).toBeGreaterThanOrEqual(fieldBottom + 8 - 1)
    const selected = page
      .getByRole('menuitemradio', {name: 'Norwegian'})
      .element()
      .getBoundingClientRect()
    expect(selected.top).toBeGreaterThanOrEqual(fieldBottom + 8 - 1)
    expect(selected.bottom).toBeLessThanOrEqual(listBottom + 1)
  })
})
