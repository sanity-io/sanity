import {Card, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {useCallback} from 'react'
import {CommandList} from 'sanity'
import {describe, expect, it} from 'vitest'
import {cleanup, render} from 'vitest-browser-react'
import {page, server} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {Pane} from '../Pane'
import {paneCommandList} from '../PaneCommandList.css'
import {PaneContent} from '../PaneContent'
import {PaneHeader} from '../PaneHeader'
import {PaneLayout} from '../PaneLayout'

const theme = buildTheme()
const {settleChromaticEndState} = testHelpers()

// Studio's `GlobalStyle` gives WebKit and Blink a classic 12px scrollbar; the gutter the list
// scroller reserves is that scrollbar's width.
const SCROLLBAR_STYLE = `
  ::-webkit-scrollbar { width: 12px; height: 12px; }
  ::-webkit-scrollbar-thumb { background-clip: content-box; background-color: #8690a0; border: 4px solid transparent; }
  ::-webkit-scrollbar-track { background: transparent; }
`

// The `CommandList` props of the built-in list panes (ListPaneContent, DocumentListPaneContent)
function Harness({items}: {items: number}) {
  const renderItem = useCallback(
    (item: number) => (
      <Card data-testid="item" marginBottom={1} padding={3} radius={2} tone="transparent">
        Item {item}
      </Card>
    ),
    [],
  )

  return (
    <ThemeProvider theme={theme}>
      <style>{SCROLLBAR_STYLE}</style>
      <div style={{height: 400, width: 700}}>
        <PaneLayout height="fill">
          <Pane id="list" minWidth={320}>
            <PaneHeader title="List" />
            <PaneContent overflow="auto">
              <CommandList
                activeItemDataAttr="data-hovered"
                ariaLabel="List"
                canReceiveFocus
                className={paneCommandList}
                itemHeight={51}
                items={Array.from({length: items}, (_, index) => index)}
                onlyShowSelectionWhenActive
                paddingBottom={1}
                paddingLeft={3}
                renderItem={renderItem}
                testId="list-scroller"
                wrapAround={false}
              />
            </PaneContent>
          </Pane>
          <Pane id="other" minWidth={320}>
            <PaneHeader title="Other" />
            <PaneContent />
          </Pane>
        </PaneLayout>
      </div>
    </ThemeProvider>
  )
}

function measure() {
  const scroller = document.querySelector<HTMLElement>('[data-testid="list-scroller"]')!
  const scrollerRect = scroller.getBoundingClientRect()
  const item = document.querySelector('[data-testid="item"]')!.getBoundingClientRect()
  const {paddingLeft, paddingRight, scrollbarGutter} = getComputedStyle(scroller)

  return {
    paddingLeft,
    paddingRight,
    scrollbarGutter,
    overflowing: scroller.scrollHeight > scroller.clientHeight,
    // Space taken by the scrollbar (or the reserved gutter) at the right edge of the scroller
    scrollbarInset: scroller.offsetWidth - scroller.clientWidth,
    itemGaps: {left: item.left - scrollerRect.left, right: scrollerRect.right - item.right},
  }
}

async function renderAndMeasure(items: number) {
  await render(<Harness items={items} />)
  await expect.element(page.getByText('Item 0')).toBeVisible()
  return measure()
}

describe('PaneCommandList', () => {
  it('ends items at the same distance from the pane edge whether or not the list overflows', async () => {
    await page.viewport(1280, 800)

    const short = await renderAndMeasure(3)
    expect(short.overflowing).toBe(false)
    await cleanup()
    const long = await renderAndMeasure(100)
    expect(long.overflowing).toBe(true)

    for (const list of [short, long]) {
      expect(list.paddingLeft).toBe('12px')
      expect(list.itemGaps.left).toBeCloseTo(12, 3)
      // Items span the scroller's content box; the right-hand spacing is whatever sits outside it
      // (`offsetWidth` and `clientWidth` are integers, hence the sub-pixel tolerance)
      expect(list.itemGaps.right).toBeCloseTo(
        list.scrollbarInset + Number.parseFloat(list.paddingRight),
        0,
      )
    }

    if (server.browser === 'firefox') {
      // Firefox ignores `::-webkit-scrollbar`, so the list keeps its `space[3]` padding there
      expect(short.paddingRight).toBe('12px')
      expect(long.paddingRight).toBe('12px')
    } else {
      // The reserved gutter is the right-hand spacing, so it must be present before the list
      // overflows, and nothing moves when the scrollbar appears. (Headless Chromium hides
      // scrollbars, so the inset is 0 there; in a headed browser it is the 12px scrollbar.)
      expect(short.scrollbarGutter).toBe('stable')
      expect(short.paddingRight).toBe('0px')
      expect(long.scrollbarInset).toBe(short.scrollbarInset)
      expect(long.itemGaps).toEqual(short.itemGaps)
    }

    await settleChromaticEndState()
  })
})
