import {afterEach} from 'node:test'

import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {useCallback} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {CommandList} from '../CommandList'

const COMMAND_LIST_TEST_ID = 'command-list'
const CUSTOM_ACTIVE_ATTR = 'my-active-data-attribute'

type Item = number

interface TestComponentProps {
  initialIndex?: number
  items: Item[]
  withDisabledItems?: boolean
}

function TestComponent(props: TestComponentProps) {
  const {initialIndex, items, withDisabledItems} = props

  const getItemDisabled = useCallback(
    (item: Item) => {
      if (!withDisabledItems) return false

      return item % 2 === 0
    },
    [withDisabledItems],
  )

  const renderItem = useCallback((item: Item) => {
    return (
      <button type="button" key={item.toString()} data-testid="button">
        Button
      </button>
    )
  }, [])

  return (
    <ThemeProvider theme={studioTheme}>
      <div style={{height: '400px', position: 'relative'}}>
        <CommandList
          activeItemDataAttr={CUSTOM_ACTIVE_ATTR}
          ariaLabel=""
          autoFocus="list"
          fixedHeight
          initialIndex={initialIndex}
          itemHeight={20}
          items={items}
          getItemDisabled={getItemDisabled}
          // TODO: Figure out why we need the overscan to be the
          // same as the number of items for the tests to pass
          overscan={items.length}
          renderItem={renderItem}
          testId={COMMAND_LIST_TEST_ID}
        />
      </div>
    </ThemeProvider>
  )
}

describe('core/components: CommandList', () => {
  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect

  const getDOMRect = (width: number, height: number) => ({
    width,
    height,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON: () => {},
  })

  beforeEach(() => {
    // Virtual list will return an empty list of items unless we have some size,
    // so we need to mock getBoundingClientRect to return a size for the list.
    // Not pretty, but it's what they recommend for testing outside of browsers:
    // https://github.com/TanStack/virtual/issues/641
    Element.prototype.getBoundingClientRect = vi.fn(function (this: Element) {
      if (this.getAttribute('data-testid') === COMMAND_LIST_TEST_ID) {
        return getDOMRect(350, 800)
      }
      return getDOMRect(0, 0)
    })
  })

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect
  })

  it('should change active item on pressing arrow keys', async () => {
    const user = userEvent.setup()

    render(<TestComponent items={[0, 1, 2, 3]} />)

    const buttons = screen.getAllByTestId('button')

    // First button should be active on render
    await waitFor(() => expect(buttons[0]).toHaveAttribute(CUSTOM_ACTIVE_ATTR))

    // Set second button as active on arrow down
    await user.keyboard('[ArrowDown]')
    expect(buttons[0]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[1]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[2]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[3]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)

    // Set third button as active on arrow down
    await user.keyboard('[ArrowDown]')
    expect(buttons[0]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[1]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[2]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[3]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)

    // Set fourth button as active on arrow down
    await user.keyboard('[ArrowDown]')
    expect(buttons[0]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[1]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[2]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[3]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)

    // Set first button as active when reaching the end of the list
    await user.keyboard('[ArrowDown]')
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
    const user = userEvent.setup()

    const items = [...Array(100).keys()]
    render(<TestComponent items={items} />)

    const buttons = screen.getAllByTestId('button')

    // Set last button as active on arrow up on the first item
    await user.keyboard('[ArrowUp]')
    expect(buttons[items.length - 1]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)

    // Set first button as active on arrow down on the last item
    await user.keyboard('[ArrowDown]')
    expect(buttons[0]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)
  })

  it('should skip disabled elements', async () => {
    const user = userEvent.setup()

    render(<TestComponent items={[0, 1, 2, 3]} withDisabledItems />)

    const buttons = screen.getAllByTestId('button')

    // Second button should be active since the first button is disabled
    await waitFor(() => expect(buttons[1]).toHaveAttribute(CUSTOM_ACTIVE_ATTR))

    // Fourth button should be active since the third is disabled
    await user.keyboard('[ArrowDown]')
    expect(buttons[0]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[1]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[2]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[3]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)
  })
})
