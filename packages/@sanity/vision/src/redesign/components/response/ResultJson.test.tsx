import {Card, studioTheme, ThemeProvider} from '@sanity/ui'
import {render} from '@testing-library/react'
import {afterAll, beforeAll, describe, expect, it} from 'vitest'

import {ResultJson} from './ResultJson'

function renderResult() {
  return render(
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    <ThemeProvider theme={studioTheme}>
      <Card>
        <ResultJson id="result" value={1} />
      </Card>
    </ThemeProvider>,
  )
}

describe('ResultJson', () => {
  // jsdom has no text range geometry, which the editor reads to measure the lines it draws
  beforeAll(() => {
    Range.prototype.getClientRects = () => document.createElement('div').getClientRects()
    Range.prototype.getBoundingClientRect = () => new DOMRect()
  })
  afterAll(() => {
    // @ts-expect-error -- removes the stand-ins again, which jsdom does not define
    delete Range.prototype.getClientRects
    // @ts-expect-error -- see above
    delete Range.prototype.getBoundingClientRect
  })

  // The gutters stick to the left while long lines scroll sideways under them, so a transparent
  // background would let the text show through the line numbers
  it('paints its sticky gutters with the card background', () => {
    const {container, unmount} = renderResult()
    const gutters = container.querySelector<HTMLElement>('.cm-gutters')
    expect(gutters).not.toBeNull()
    const style = getComputedStyle(gutters!)
    expect(style.position).toBe('sticky')
    expect(style.backgroundColor).not.toBe('transparent')
    expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(style.backgroundColor).not.toBe('')
    unmount()
  })
})
