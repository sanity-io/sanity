import {act, render} from '@testing-library/react'
import {Activity} from 'react'
import {createPortal} from 'react-dom'
import {describe, expect, it} from 'vitest'

import {useElementState} from '../useElementState'

function PortalIntoOwnWrapper({onRender}: {onRender: (element: HTMLDivElement | null) => void}) {
  const [wrapper, setWrapper] = useElementState<HTMLDivElement>()
  onRender(wrapper)
  return (
    <div data-testid="wrapper" ref={setWrapper}>
      {wrapper && createPortal(<span data-testid="content">content</span>, wrapper)}
    </div>
  )
}

describe('useElementState', () => {
  it('keeps the element while an Activity boundary hides the component', async () => {
    const seen: Array<HTMLDivElement | null> = []
    const onRender = (element: HTMLDivElement | null) => seen.push(element)
    const {container, rerender} = render(
      <Activity mode="visible">
        <PortalIntoOwnWrapper onRender={onRender} />
      </Activity>,
    )
    const wrapper = container.querySelector('[data-testid="wrapper"]')
    const content = container.querySelector('[data-testid="content"]')
    expect(content?.parentElement).toBe(wrapper)

    // React detaches refs when the boundary hides. A `useState` setter used as the ref would be
    // called with `null` here, re-render the hidden tree and move the portal content out of the
    // wrapper; the hidden render is deferred, so give it a tick to happen if it is going to.
    rerender(
      <Activity mode="hidden">
        <PortalIntoOwnWrapper onRender={onRender} />
      </Activity>,
    )
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(seen.at(-1)).toBe(wrapper)
    expect(container.querySelector('[data-testid="content"]')).toBe(content)
    expect(content?.parentElement).toBe(wrapper)

    rerender(
      <Activity mode="visible">
        <PortalIntoOwnWrapper onRender={onRender} />
      </Activity>,
    )
    expect(seen.at(-1)).toBe(wrapper)
    expect(container.querySelector('[data-testid="content"]')).toBe(content)
  })

  it('follows the element when it is replaced', () => {
    const seen: Array<HTMLDivElement | null> = []
    function Replaceable({generation}: {generation: number}) {
      const [element, setElement] = useElementState<HTMLDivElement>()
      seen.push(element)
      return <div key={generation} data-generation={generation} ref={setElement} />
    }
    const {container, rerender} = render(<Replaceable generation={1} />)
    const first = container.firstElementChild
    expect(seen.at(-1)).toBe(first)

    rerender(<Replaceable generation={2} />)
    const second = container.firstElementChild
    expect(second).not.toBe(first)
    expect(seen.at(-1)).toBe(second)
  })
})
