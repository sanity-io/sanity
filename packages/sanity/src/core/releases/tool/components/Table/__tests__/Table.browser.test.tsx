import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'

import {TableStory} from './TableStory'

describe('Table (virtualized)', () => {
  // Regression test for SAPP-3955: WebKit doesn't support `position: relative`
  // on internal table boxes (https://bugs.webkit.org/show_bug.cgi?id=240961),
  // so without `display: block` on the tbody the absolutely positioned rows
  // resolve their containing block above the table, shifting every row up by
  // one header height and hiding the first row behind the sticky header.
  it('positions all rows below the sticky header', async () => {
    void render(<TableStory />)

    await expect.poll(() => document.querySelectorAll('[data-testid="table-row"]').length).toBe(4)

    const thead = document.querySelector('thead')!
    const rows = [...document.querySelectorAll('[data-testid="table-row"]')]

    const theadBottom = thead.getBoundingClientRect().bottom
    for (const row of rows) {
      expect(row.getBoundingClientRect().top).toBeGreaterThanOrEqual(theadBottom - 1)
    }

    // The first row must actually be hit-testable, not painted under the header
    const firstRow = rows.find((row) => row.textContent?.includes('Document 0'))!
    const rect = firstRow.getBoundingClientRect()
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    expect(firstRow.contains(hit)).toBe(true)
  })
})
