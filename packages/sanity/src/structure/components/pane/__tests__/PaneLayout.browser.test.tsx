import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {beforeEach, describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {Pane} from '../Pane'
import {PaneHeader} from '../PaneHeader'
import {PaneLayout} from '../PaneLayout'

const theme = buildTheme()
const {settleChromaticEndState} = testHelpers()

// Width props of the built-in list panes (ListPane) and document panes (DocumentLayout)
function Harness({documents}: {documents: number}) {
  return (
    <ThemeProvider theme={theme}>
      <PaneLayout data-testid="pane-layout">
        <Pane id="content" currentMaxWidth={350} maxWidth={640} minWidth={320}>
          <PaneHeader title="Content" />
        </Pane>
        <Pane id="articles" currentMaxWidth={350} maxWidth={640} minWidth={320}>
          <PaneHeader title="Articles" />
        </Pane>
        {Array.from({length: documents}, (_, index) => (
          <Pane
            key={index}
            id={`document-${index}`}
            currentMinWidth={600}
            flex={2.5}
            minWidth={320}
          >
            <PaneHeader title="Document" />
          </Pane>
        ))}
      </PaneLayout>
    </ThemeProvider>
  )
}

function paneWidths() {
  return Array.from(
    window.document.querySelectorAll('[data-testid="pane"]'),
    (pane) => pane.getBoundingClientRect().width,
  )
}

function approximately(widths: number[]) {
  return widths.map((width) => expect.closeTo(width, 1))
}

function isResizing() {
  return window.document.querySelector('[data-testid="pane-layout"]')?.hasAttribute('data-resizing')
}

async function dragDivider(paneIndex: number, deltaX: number) {
  const pane = window.document.querySelectorAll('[data-testid="pane"]')[paneIndex]
  const {right, top, height} = pane.getBoundingClientRect()
  const clientY = top + height / 2
  const divider = window.document.elementFromPoint(right, clientY)
  if (!divider) throw new Error(`No divider after pane ${paneIndex}`)

  divider.dispatchEvent(
    new MouseEvent('mousedown', {bubbles: true, cancelable: true, clientX: right, clientY}),
  )
  window.dispatchEvent(new MouseEvent('mousemove', {clientX: right + deltaX, clientY}))
  await expect.poll(isResizing).toBe(true)
  const held = paneWidths()

  window.dispatchEvent(new MouseEvent('mouseup', {clientX: right + deltaX, clientY}))
  await expect.poll(isResizing).toBe(false)

  return {held, released: paneWidths()}
}

describe('PaneLayout', () => {
  beforeEach(async () => {
    // At the default viewport width, the list panes start at their minimum width
    await page.viewport(1920, 1080)
  })

  it('keeps pane widths when releasing a divider next to a document pane', async () => {
    await render(<Harness documents={1} />)
    await expect.poll(paneWidths).toEqual([350, 350, 1218])

    const narrowed = await dragDivider(0, -20)
    expect(narrowed.held).toEqual([330, 370, 1218])
    expect(narrowed.released).toEqual(approximately(narrowed.held))

    const widened = await dragDivider(1, 200)
    expect(widened.held).toEqual([330, 570, 1018])
    expect(widened.released).toEqual(approximately(widened.held))
  })

  it('keeps pane widths when releasing a divider without a document pane', async () => {
    await render(<Harness documents={0} />)
    await expect.poll(paneWidths).toEqual([350, 350])

    const narrowed = await dragDivider(0, -20)
    expect(narrowed.held).toEqual([330, 370])
    expect(narrowed.released).toEqual(approximately(narrowed.held))
  })

  it('keeps pane widths when releasing a divider next to two document panes', async () => {
    await render(<Harness documents={2} />)
    await expect.poll(paneWidths).toEqual([320, 320, 638.5, 638.5])

    const widened = await dragDivider(1, 50)
    expect(widened.held).toEqual([320, 370, 588.5, 638.5])
    expect(widened.released).toEqual(approximately(widened.held))
  })

  it('keeps pane widths when releasing a divider after closing a wide document pane', async () => {
    await page.viewport(3840, 1080)
    const {rerender} = await render(<Harness documents={1} />)
    await expect.poll(paneWidths).toEqual([350, 350, 3138])
    await dragDivider(0, -20)

    await rerender(<Harness documents={0} />)
    await page.viewport(770, 1080)
    await expect.poll(paneWidths).toEqual(approximately([330, 370]))

    const widened = await dragDivider(0, 10)
    expect(widened.held).toEqual([340, 360])
    expect(widened.released).toEqual(approximately(widened.held))
  })

  it('restores a collapsed pane when expanding it after resizing other panes', async () => {
    await render(<Harness documents={1} />)
    await expect.poll(paneWidths).toEqual([350, 350, 1218])

    // Clicking a pane title collapses the pane, and clicking it again expands it
    const contentTitle = page.getByText('Content', {exact: true})
    await contentTitle.click()
    await expect.poll(paneWidths).toEqual([51, 350, 1517])

    const narrowed = await dragDivider(1, -20)
    expect(narrowed.held).toEqual([51, 330, 1537])
    expect(narrowed.released).toEqual(approximately(narrowed.held))

    await contentTitle.click()
    await expect.poll(paneWidths).toEqual(approximately([350, 320, 1248]))
    await settleChromaticEndState()
  })
})
