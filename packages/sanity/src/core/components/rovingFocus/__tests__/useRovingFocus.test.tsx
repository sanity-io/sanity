// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {render, fireEvent} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, {useState} from 'react'
import {Card, studioTheme, ThemeProvider} from '@sanity/ui'
import {RovingFocusProps} from '../types'
import {Button} from '../../../../ui-components'
import {useRovingFocus} from '../useRovingFocus'

interface TestProps extends Pick<RovingFocusProps, 'direction' | 'initialFocus' | 'loop'> {
  withDisabledButtons?: boolean
}

function RenderTestComponent(props: TestProps) {
  const {direction, loop, withDisabledButtons, initialFocus} = props
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)

  useRovingFocus({
    direction: direction,
    loop: loop,
    rootElement: rootElement,
    initialFocus: initialFocus,
  })

  return (
    <ThemeProvider theme={studioTheme}>
      <Card ref={setRootElement} id="rootElement">
        <Button text="Test" disabled={withDisabledButtons} />
        <Button text="Test" />
        <Button text="Test" disabled={withDisabledButtons} />
        <Button text="Test" />
      </Card>
    </ThemeProvider>
  )
}

describe('base/useRovingFocus:', () => {
  /**
   * Horizontal direction
   */
  it('horizontal direction', () => {
    const {container} = render(<RenderTestComponent />)
    const rootElement = container.querySelector('#rootElement')
    const buttons = rootElement!.querySelectorAll('button')

    // Focus button #0 on tab
    userEvent.tab()
    expect(buttons[0]).toBe(document.activeElement)

    // Focus button #1 on arrow right
    fireEvent.keyDown(rootElement!, {key: 'ArrowRight'})
    expect(buttons[1]).toBe(document.activeElement)

    // Focus button #2 on arrow right
    fireEvent.keyDown(rootElement!, {key: 'ArrowRight'})
    expect(buttons[2]).toBe(document.activeElement)

    // Focus button #3 on arrow right
    fireEvent.keyDown(rootElement!, {key: 'ArrowRight'})
    expect(buttons[3]).toBe(document.activeElement)

    // Focus button #0 on arrow right
    fireEvent.keyDown(rootElement!, {key: 'ArrowRight'})
    expect(buttons[0]).toBe(document.activeElement)

    // Focus button #3 on arrow left
    fireEvent.keyDown(rootElement!, {key: 'ArrowLeft'})
    expect(buttons[3]).toBe(document.activeElement)

    // Focus button #2 on arrow left
    fireEvent.keyDown(rootElement!, {key: 'ArrowLeft'})
    expect(buttons[2]).toBe(document.activeElement)
  })

  /**
   * Vertical direction
   */
  it('vertical direction', () => {
    const {container} = render(<RenderTestComponent direction="vertical" />)
    const rootElement = container.querySelector('#rootElement')
    const buttons = rootElement!.querySelectorAll('button')

    // Focus button #0 on tab
    userEvent.tab()
    expect(buttons[0]).toBe(document.activeElement)

    // Focus button #1 on arrow down
    fireEvent.keyDown(rootElement!, {key: 'ArrowDown'})
    expect(buttons[1]).toBe(document.activeElement)

    // Focus button #2 on arrow down
    fireEvent.keyDown(rootElement!, {key: 'ArrowDown'})
    expect(buttons[2]).toBe(document.activeElement)

    // Focus button #3 on arrow down
    fireEvent.keyDown(rootElement!, {key: 'ArrowDown'})
    expect(buttons[3]).toBe(document.activeElement)

    // Focus button #0 on arrow down
    fireEvent.keyDown(rootElement!, {key: 'ArrowDown'})
    expect(buttons[0]).toBe(document.activeElement)

    // Focus button #3 on arrow right
    fireEvent.keyDown(rootElement!, {key: 'ArrowUp'})
    expect(buttons[3]).toBe(document.activeElement)

    // Focus button #2 on arrow right
    fireEvent.keyDown(rootElement!, {key: 'ArrowUp'})
    expect(buttons[2]).toBe(document.activeElement)
  })

  /**
   * With disabled buttons
   */
  it('with disabled buttons', () => {
    const {container} = render(<RenderTestComponent withDisabledButtons />)
    const rootElement = container.querySelector('#rootElement')
    const buttons = rootElement!.querySelectorAll('button')

    // Focus button #1 on tab
    userEvent.tab()
    expect(buttons[1]).toBe(document.activeElement)

    // Focus button #3 on arrow right (skips #2 because it is disabled)
    fireEvent.keyDown(rootElement!, {key: 'ArrowRight'})
    expect(buttons[3]).toBe(document.activeElement)

    // Focus button #1 on arrow right (skips #0 because it is disabled)
    fireEvent.keyDown(rootElement!, {key: 'ArrowRight'})
    expect(buttons[1]).toBe(document.activeElement)
  })

  /**
   * Without loop
   */
  it('without loop', () => {
    const {container} = render(<RenderTestComponent loop={false} />)
    const rootElement = container.querySelector('#rootElement')
    const buttons = rootElement!.querySelectorAll('button')

    // Focus button #0 on tab
    userEvent.tab()
    expect(buttons[0]).toBe(document.activeElement)

    // Focus button #1 on arrow right
    fireEvent.keyDown(rootElement!, {key: 'ArrowRight'})
    expect(buttons[1]).toBe(document.activeElement)

    // Focus button #2 on arrow right
    fireEvent.keyDown(rootElement!, {key: 'ArrowRight'})
    expect(buttons[2]).toBe(document.activeElement)

    // Focus button #3 on arrow right
    fireEvent.keyDown(rootElement!, {key: 'ArrowRight'})
    expect(buttons[3]).toBe(document.activeElement)

    // Focus button #3 on arrow right (because loop is disabled, the focus stays on #3)
    fireEvent.keyDown(rootElement!, {key: 'ArrowRight'})
    expect(buttons[3]).toBe(document.activeElement)
  })

  /**
   * Initial focus last
   */
  it('initial focus last', () => {
    const {container} = render(<RenderTestComponent initialFocus="last" />)
    const rootElement = container.querySelector('#rootElement')
    const buttons = rootElement!.querySelectorAll('button')

    // Focus button #3 on tab (the last button)
    userEvent.tab()
    expect(buttons[3]).toBe(document.activeElement)

    // Focus button #0 on arrow right
    fireEvent.keyDown(rootElement!, {key: 'ArrowRight'})
    expect(buttons[0]).toBe(document.activeElement)
  })
})
