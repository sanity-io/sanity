import {studioTheme, ThemeProvider} from '@sanity/ui'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {useCallback} from 'react'
import {beforeEach, describe, expect, it} from 'vitest'

import {CommandList} from '../CommandList'

const COMMAND_LIST_TEST_ID = 'command-list'
const CUSTOM_ACTIVE_ATTR = 'my-active-data-attribute'

type Item = number

const resizeObservers = new Set<TestResizeObserver>()

class TestResizeObserver implements ResizeObserver {
  private readonly callback: ResizeObserverCallback
  private readonly targets = new Set<Element>()

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    resizeObservers.add(this)
  }

  disconnect() {
    this.targets.clear()
    resizeObservers.delete(this)
  }

  observe(target: Element) {
    this.targets.add(target)
  }

  unobserve(target: Element) {
    this.targets.delete(target)
  }

  trigger() {
    const entries = [...this.targets].map(
      (target) =>
        ({
          contentRect: target.getBoundingClientRect(),
          target,
        }) as ResizeObserverEntry,
    )
    this.callback(entries, this)
  }
}

const triggerResizeObservers = () => {
  resizeObservers.forEach((observer) => observer.trigger())
}

interface TestComponentProps {
  collapsed?: boolean
  initialIndex?: number
  items: Item[]
  overscan?: number
  withDisabledItems?: boolean
}

function TestComponent(props: TestComponentProps) {
  const {collapsed, initialIndex, items, overscan = items.length, withDisabledItems} = props

  const getItemDisabled = useCallback(
    (item: Item) => {
      if (!withDisabledItems) return false

      return item % 2 === 0
    },
    [withDisabledItems],
  )

  const renderItem = useCallback((item: Item) => {
    return (
      <button key={item.toString()} type="button" data-testid="button">
        Button {item}
      </button>
    )
  }, [])

  return (
    <ThemeProvider theme={studioTheme}>
      <div hidden={collapsed} style={{height: '400px', position: 'relative'}}>
        <CommandList
          activeItemDataAttr={CUSTOM_ACTIVE_ATTR}
          ariaLabel=""
          autoFocus="list"
          fixedHeight
          initialIndex={initialIndex}
          itemHeight={20}
          items={items}
          getItemDisabled={getItemDisabled}
          overscan={overscan}
          renderItem={renderItem}
          testId={COMMAND_LIST_TEST_ID}
        />
      </div>
    </ThemeProvider>
  )
}

describe('core/components: CommandList', () => {
  beforeEach(() => {
    const originalResizeObserver = globalThis.ResizeObserver
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetHeight',
    )
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth',
    )
    globalThis.ResizeObserver = TestResizeObserver
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return this.closest('[hidden]') ? 0 : 800
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        return this.closest('[hidden]') ? 0 : 800
      },
    })

    return () => {
      resizeObservers.clear()
      globalThis.ResizeObserver = originalResizeObserver
      if (originalOffsetHeight) {
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight)
      }
      if (originalOffsetWidth) {
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth)
      }
    }
  })

  it('should change active item on pressing arrow keys', async () => {
    render(<TestComponent items={[0, 1, 2, 3]} />)

    const buttons = screen.getAllByTestId('button')

    // First button should be active on render
    await waitFor(() => expect(buttons[0]).toHaveAttribute(CUSTOM_ACTIVE_ATTR))

    // Set second button as active on arrow down
    await userEvent.keyboard('[ArrowDown]')
    expect(buttons[0]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[1]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[2]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[3]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)

    // Set third button as active on arrow down
    await userEvent.keyboard('[ArrowDown]')
    expect(buttons[0]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[1]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[2]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[3]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)

    // Set fourth button as active on arrow down
    await userEvent.keyboard('[ArrowDown]')
    expect(buttons[0]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[1]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[2]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[3]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)

    // Set first button as active when reaching the end of the list
    await userEvent.keyboard('[ArrowDown]')
    expect(buttons[0]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[1]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[2]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[3]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
  })

  it('should set the initial active item based on the initialIndex prop', async () => {
    render(<TestComponent initialIndex={2} items={[0, 1, 3, 4]} />)

    const buttons = screen.getAllByTestId('button')

    // Button with index 2 should be active on render
    await waitFor(() => expect(buttons[0]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR))
    expect(buttons[1]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[2]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[3]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
  })

  it('should set the last item as active when pressing key up on the first item', async () => {
    const items = [...Array(100).keys()]
    render(<TestComponent items={items} />)

    const buttons = screen.getAllByTestId('button')

    // Set last button as active on arrow up on the first item
    await userEvent.keyboard('[ArrowUp]')
    expect(buttons[items.length - 1]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)

    // Set first button as active on arrow down on the last item
    await userEvent.keyboard('[ArrowDown]')
    expect(buttons[0]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)
  })

  it('should skip disabled elements', async () => {
    render(<TestComponent items={[0, 1, 2, 3]} withDisabledItems />)

    const buttons = screen.getAllByTestId('button')

    // Second button should be active since the first button is disabled
    await waitFor(() => expect(buttons[1]).toHaveAttribute(CUSTOM_ACTIVE_ATTR))

    // Fourth button should be active since the third is disabled
    await userEvent.keyboard('[ArrowDown]')
    expect(buttons[0]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[1]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[2]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[3]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)
  })

  it('should sync rendered items with the scroll position after becoming visible', async () => {
    const items = [...Array(100).keys()]
    const {rerender} = render(<TestComponent items={items} overscan={0} />)
    const commandList = screen.getByTestId(COMMAND_LIST_TEST_ID)

    commandList.scrollTop = 1200
    fireEvent.scroll(commandList)

    await waitFor(() => expect(screen.queryByText('Button 0')).not.toBeInTheDocument())

    rerender(<TestComponent collapsed items={items} overscan={0} />)
    act(triggerResizeObservers)
    commandList.scrollTop = 0
    rerender(<TestComponent items={items} overscan={0} />)
    act(triggerResizeObservers)

    expect(await screen.findByText('Button 0')).toBeInTheDocument()
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 200)))
    expect(screen.getByText('Button 0')).toBeInTheDocument()
  })
})
