import {configure} from '@chromatic-com/vitest'
import {Card, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'

import {VariantMark} from '../VariantMark'

// Checked by computed colour, not archived
configure({disableAutoSnapshot: true})

const theme = buildTheme()

/** Resolves a colour expression on an element to the colour the browser paints. */
function resolve(element: Element, value: string): string {
  const probe = document.createElement('span')
  element.append(probe)
  probe.style.color = value
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

function SelectedRow({inStatusSlot}: {inStatusSlot: boolean}) {
  return (
    <ThemeProvider theme={theme}>
      <Card as="button" selected data-testid="row" padding={2}>
        {inStatusSlot ? (
          // The document list row's status slot, as `DocumentVersionsStatusIndicator` renders it
          <div data-status="variant">
            <VariantMark size="inline" />
          </div>
        ) : (
          <VariantMark size="inline" />
        )}
      </Card>
    </ThemeProvider>
  )
}

describe('VariantMark on a selected item', () => {
  it('takes the item text colour in a menu row or other selected item', async () => {
    await render(<SelectedRow inStatusSlot={false} />)
    const row = document.querySelector('[data-testid="row"]')!
    const mark = row.querySelector('[data-ui="VariantMark"]')!
    expect(getComputedStyle(mark).color).toBe(resolve(row, 'var(--card-fg-color)'))
  })

  it('stays a pale purple in a document list row status slot, like the marks next to it', async () => {
    await render(<SelectedRow inStatusSlot />)
    const row = document.querySelector('[data-testid="row"]')!
    const slot = row.querySelector('[data-status="variant"]')!
    const mark = row.querySelector('[data-ui="VariantMark"]')!
    const dot = resolve(slot, 'var(--card-badge-suggest-dot-color)')
    expect(dot).not.toBe(resolve(slot, 'var(--card-fg-color)'))
    expect(getComputedStyle(mark).color).toBe(dot)
  })
})
