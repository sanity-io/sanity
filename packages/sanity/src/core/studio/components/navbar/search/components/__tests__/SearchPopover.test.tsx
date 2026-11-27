import {act, render, screen, waitForElementToBeRemoved} from '@testing-library/react'
import noop from 'lodash-es/noop.js'
import {describe, expect, test, vi} from 'vitest'

import {stubViewTransitions} from '../../../../../../../../test/testUtils/stubViewTransitions'
import {createTestProvider} from '../../../../../../../../test/testUtils/TestProvider'
import {SearchProvider} from '../../contexts/search/SearchProvider'
import {SearchPopover} from '../SearchPopover'

/** Presses the mouse button down on `element`, the event the popover's click-outside handler listens to */
function mouseDownOn(element: Element) {
  act(() => {
    element.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
  })
}

function Search(props: {onClose?: () => void; open: boolean}) {
  return (
    <SearchProvider>
      <SearchPopover onClose={props.onClose ?? noop} open={props.open} />
    </SearchProvider>
  )
}

describe('SearchPopover', () => {
  test('opens and closes in transitions of its own type that fade the overlay and pop the card', async () => {
    const pictured = stubViewTransitions()
    const wrapper = await createTestProvider()
    const {rerender} = render(<Search open={false} />, {wrapper})

    // The transition that opens the popover waits for the content's chunk
    rerender(<Search open />)
    await act(async () => vi.dynamicImportSettled())
    expect(await screen.findByPlaceholderText('Search')).toBeInTheDocument()

    expect(pictured).toEqual([{types: ['sanity-search-popover'], old: [], new: ['div', 'div']}])

    rerender(<Search open={false} />)

    await waitForElementToBeRemoved(() => screen.queryByPlaceholderText('Search'))
    expect(pictured.at(-1)).toEqual({
      types: ['sanity-search-popover'],
      old: ['div', 'div'],
      new: [],
    })
  })

  test('closes on a click outside the card only once the card is shown', async () => {
    stubViewTransitions()
    const onClose = vi.fn()
    const wrapper = await createTestProvider()
    const {rerender} = render(<Search onClose={onClose} open={false} />, {wrapper})

    // Open, with the card still a transition away: a click anywhere is not outside of it yet
    rerender(<Search onClose={onClose} open />)
    mouseDownOn(document.body)
    expect(onClose).not.toHaveBeenCalled()

    expect(await screen.findByPlaceholderText('Search')).toBeInTheDocument()
    mouseDownOn(document.body)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
