import {render, screen, waitFor} from '@testing-library/react'
import {useState} from 'react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {PopoverDialog} from './PopoverDialog'

function Harness() {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null)
  const [capturedScroller, setCapturedScroller] = useState<HTMLDivElement | null>(null)
  return (
    <>
      <button ref={setReferenceElement} type="button">
        Open
      </button>
      {referenceElement && (
        <PopoverDialog
          header="Edit item"
          onClose={() => undefined}
          referenceElement={referenceElement}
          width={1}
          containerRef={setCapturedScroller}
        >
          <div>popover body</div>
        </PopoverDialog>
      )}
      {capturedScroller && (
        <span
          data-testid="captured-scroller-ready"
          data-ui={capturedScroller.getAttribute('data-ui')}
        />
      )}
    </>
  )
}

describe('PopoverDialog', () => {
  it('makes the popover wrapper a positioned scroller for change connectors', async () => {
    const TestProvider = await createTestProvider()

    render(<Harness />, {wrapper: TestProvider})

    await waitFor(() => {
      expect(screen.getByTestId('popover-dialog')).toBeInTheDocument()
      expect(screen.getByTestId('captured-scroller-ready')).toBeInTheDocument()
    })

    expect(screen.getByTestId('captured-scroller-ready')).toHaveAttribute(
      'data-ui',
      'Popover__wrapper',
    )

    const wrapper = screen.getByTestId('captured-scroller-ready').getAttribute('data-ui')
    expect(wrapper).toBe('Popover__wrapper')
  })
})
