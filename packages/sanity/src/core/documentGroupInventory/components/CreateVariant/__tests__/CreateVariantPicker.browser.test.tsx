import {configure} from '@chromatic-com/vitest'
import {DocumentIcon} from '@sanity/icons/Document'
import {BoundaryElementProvider} from '@sanity/ui'
import {useState} from 'react'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {CreateVariantPicker} from '../CreateVariantPicker'

// The open menu is a measurement, not a visual state worth archiving.
configure({disableAutoSnapshot: true})

const OPTIONS = ['German', 'Swedish', 'Norwegian'].map((text) => ({
  key: text,
  text,
  icon: DocumentIcon,
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
  it('puts the first row 8px below the search field, 8px from the sides, the last 4px from the bottom', async () => {
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
    expect(Math.abs(below - 4)).toBeLessThanOrEqual(1)
  })
})
