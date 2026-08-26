import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {PreviewTooltip} from '../PreviewTooltip'

const theme = buildTheme()

const ROW_COUNT = 20

function renderScrollableList() {
  return render(
    <ThemeProvider theme={theme}>
      <div data-testid="scroll-container" style={{height: 150, overflow: 'auto'}}>
        {Array.from({length: ROW_COUNT}, (_, index) => (
          <PreviewTooltip content={`Status for row ${index}`} key={index}>
            <div data-testid={`row-${index}`} style={{height: 40}}>
              Row {index}
            </div>
          </PreviewTooltip>
        ))}
      </div>
    </ThemeProvider>,
  )
}

describe('PreviewTooltip', () => {
  it('shows the tooltip on hover and closes it when the list scrolls underneath', async () => {
    void renderScrollableList()

    // Hover a row and wait for its tooltip to open (it has an open delay)
    await userEvent.hover(page.getByTestId('row-1'))
    await expect.element(page.getByText('Status for row 1', {exact: true})).toBeVisible()

    // Scroll the list without moving the pointer. Scrolling fires no
    // mouseleave, so without the scroll guard the tooltip would stay open,
    // detached from the row it was anchored to (SAPP-2645).
    const container = page.getByTestId('scroll-container').element()
    container.scrollTop = 80

    await expect.element(page.getByText('Status for row 1', {exact: true})).not.toBeInTheDocument()

    // The tooltip must not come back on its own while the pointer rests on
    // the row (longer than the tooltip open delay).
    await new Promise((resolve) => setTimeout(resolve, 600))
    await expect.element(page.getByText('Status for row 1', {exact: true})).not.toBeInTheDocument()

    // Hovering another row must show its tooltip again: the suppression only
    // lasts until the pointer leaves the row that was scrolled under it.
    await userEvent.hover(page.getByTestId('row-4'))
    await expect.element(page.getByText('Status for row 4', {exact: true})).toBeVisible()
  })
})
