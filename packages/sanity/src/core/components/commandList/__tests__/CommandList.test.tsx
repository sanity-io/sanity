// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, {useCallback} from 'react'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {CommandList} from '../CommandList'

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
        />
      </div>
    </ThemeProvider>
  )
}

describe('core/components: CommandList', () => {
  it('should change active item on pressing arrow keys', () => {
    render(<TestComponent items={[0, 1, 2, 3]} />)

    const buttons = screen.getAllByTestId('button')

    // First button should be active on render
    expect(buttons[0]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)

    // Set second button as active on arrow down
    userEvent.keyboard('[ArrowDown]')
    expect(buttons[0]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[1]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[2]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[3]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)

    // Set third button as active on arrow down
    userEvent.keyboard('[ArrowDown]')
    expect(buttons[0]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[1]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[2]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[3]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)

    // Set fourth button as active on arrow down
    userEvent.keyboard('[ArrowDown]')
    expect(buttons[0]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[1]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[2]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[3]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)

    // Set first button as active when reaching the end of the list
    userEvent.keyboard('[ArrowDown]')
    expect(buttons[0]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[1]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[2]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[3]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
  })

  it('should set the initial active item based on the initialIndex prop', () => {
    render(<TestComponent initialIndex={2} items={[0, 1, 3, 4]} />)

    const buttons = screen.getAllByTestId('button')

    // Button with index 2 should be active on render
    expect(buttons[0]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[1]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[2]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[3]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
  })

  it('should set the last item as active when pressing key up on the first item', () => {
    const items = [...Array(100).keys()]
    render(<TestComponent items={items} />)

    const buttons = screen.getAllByTestId('button')

    // Set last button as active on arrow up on the first item
    userEvent.keyboard('[ArrowUp]')
    expect(buttons[items.length - 1]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)

    // Set first button as active on arrow down on the last item
    userEvent.keyboard('[ArrowDown]')
    expect(buttons[0]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)
  })

  it('should skip disabled elements', () => {
    render(<TestComponent items={[0, 1, 2, 3]} withDisabledItems />)

    const buttons = screen.getAllByTestId('button')

    // Second button should be active since the first button is disabled
    expect(buttons[1]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)

    // Fourth button should be active since the third is disabled
    userEvent.keyboard('[ArrowDown]')
    expect(buttons[0]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[1]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[2]).not.toHaveAttribute(CUSTOM_ACTIVE_ATTR)
    expect(buttons[3]).toHaveAttribute(CUSTOM_ACTIVE_ATTR)
  })
})
