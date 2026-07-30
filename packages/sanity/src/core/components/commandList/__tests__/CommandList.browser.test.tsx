import {studioTheme, ThemeProvider} from '@sanity/ui'
import {useCallback} from 'react'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {CommandList} from '../CommandList'

const COMMAND_LIST_TEST_ID = 'command-list'

type Item = number

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

interface TestComponentProps {
  hidden?: boolean
  items: Item[]
}

function TestComponent(props: TestComponentProps) {
  const {hidden, items} = props

  const renderItem = useCallback((item: Item) => {
    return (
      <button key={item.toString()} type="button" data-testid="button">
        Button {item}
      </button>
    )
  }, [])

  return (
    <ThemeProvider theme={studioTheme}>
      <div hidden={hidden} style={{height: '400px', position: 'relative'}}>
        <CommandList
          ariaLabel=""
          autoFocus="list"
          fixedHeight={false}
          itemHeight={20}
          items={items}
          overscan={0}
          renderItem={renderItem}
          testId={COMMAND_LIST_TEST_ID}
        />
      </div>
    </ThemeProvider>
  )
}

describe('CommandList', () => {
  it('preserves row measurements while hidden so the list recovers when shown again', async () => {
    const items = [...Array(100).keys()]
    const {rerender} = await render(<TestComponent items={items} />)

    // The first row is rendered and measured (dynamic row heights) while visible.
    await expect.element(page.getByText('Button 0', {exact: true})).toBeVisible()

    // Hide the list (like PaneContent does for a collapsed structure pane): the
    // rows lose their boxes and ResizeObserver reports them as zero-sized.
    // Without preserving cached sizes, the zeroed rows make the virtualizer
    // compensate its tracked scroll offset when they regrow on re-show,
    // desyncing it from the element's real scroll position and breaking the
    // rendered range.
    await rerender(<TestComponent hidden items={items} />)
    await expect.element(page.getByTestId(COMMAND_LIST_TEST_ID)).not.toBeVisible()

    // Wait a couple of frames so ResizeObserver delivers the zero-size entries
    // while hidden.
    await nextFrame()
    await nextFrame()

    // Show the list again: it should recover and still render from the top.
    await rerender(<TestComponent items={items} />)
    await expect.element(page.getByText('Button 0', {exact: true})).toBeVisible()
  })
})
