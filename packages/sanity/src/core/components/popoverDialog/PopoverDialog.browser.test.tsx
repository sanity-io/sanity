import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {useState} from 'react'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {PopoverDialog} from './PopoverDialog'

const theme = buildTheme()

function Harness() {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null)

  return (
    <ThemeProvider theme={theme}>
      <button ref={setReferenceElement} type="button">
        Open
      </button>
      {referenceElement && (
        <PopoverDialog
          header="Edit item"
          onClose={() => undefined}
          referenceElement={referenceElement}
          width={1}
        >
          <div>popover body</div>
        </PopoverDialog>
      )}
    </ThemeProvider>
  )
}

describe('PopoverDialog', () => {
  it('positions the popover wrapper so change connectors subtract its scrollTop', async () => {
    await render(<Harness />)
    await expect.element(page.getByTestId('popover-dialog')).toBeVisible()

    const wrapper = document.querySelector<HTMLElement>('[data-ui="Popover__wrapper"]')!
    expect(wrapper).not.toBeNull()
    await expect.poll(() => wrapper.getBoundingClientRect().height).toBeGreaterThan(0)
    expect(getComputedStyle(wrapper).position).toBe('relative')
    // Content-box capture height was flipping by 2px between identical-code
    // builds; wait until the wrapper box stops moving.
    const boxSig = () => {
      const r = wrapper.getBoundingClientRect()
      return `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.x)},${Math.round(r.y)}`
    }
    let previous = ''
    let stable = 0
    await expect
      .poll(() => {
        const next = boxSig()
        if (next && next === previous) stable += 1
        else {
          previous = next
          stable = 0
        }
        return stable >= 3
      })
      .toBe(true)
  })
})
