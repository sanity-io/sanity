import {render, renderHook} from '@testing-library/react'
import React, {createRef} from 'react'
import {useOnClickOutside} from '../useOnClickOutside'

describe('useOnClickOutside', () => {
  it('calls the handler when clicking outside of the refs', () => {
    const handler = jest.fn()
    const ref1 = createRef<HTMLDivElement>()
    const ref2 = createRef<HTMLDivElement>()

    render(
      <div>
        <div ref={ref1} />
        <div ref={ref2} />
      </div>
    )

    renderHook(() => {
      useOnClickOutside([ref1, ref2], handler)
      return {ref1, ref2}
    })

    // Create an element to represent the click target outside of the refs
    const target = document.createElement('div')
    document.body.appendChild(target)

    // Simulate a click event on the target element
    const event = new MouseEvent('mousedown', {bubbles: true})
    target.dispatchEvent(event)

    expect(handler).toHaveBeenCalledTimes(1)

    // Clean up the target element
    document.body.removeChild(target)
  })

  it('does not call the handler when clicking inside of the refs', () => {
    const handler = jest.fn()
    const ref1 = createRef<HTMLDivElement>()
    const ref2 = createRef<HTMLDivElement>()

    render(
      <div>
        <div ref={ref1} />
        <div ref={ref2} />
      </div>
    )

    const {result} = renderHook(() => {
      useOnClickOutside([ref1, ref2], handler)
      return {ref1, ref2}
    })

    // Create an element to represent a click target inside one of the refs
    const target = document.createElement('div')
    result.current.ref1.current?.appendChild(target)

    // Simulate a click event on the target element
    const event = new MouseEvent('mousedown', {bubbles: true})
    target.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()

    // Clean up the target element
    result.current.ref1.current?.removeChild(target)
  })
})
