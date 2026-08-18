import {type CSSProperties} from 'react'
import {expect, test} from 'vitest'
import {render} from 'vitest-browser-react'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {PaneHeader} from '../PaneHeader'

// PaneHeader Root sets line-height: 0, which collapses native buttons to a
// zero-height box. Size them like a bleed Button (~25px) so the title row is
// taller, matching FavoriteToggle in the document pane.
const bleedButtonStyle: CSSProperties = {
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  height: 25,
  lineHeight: '25px',
  padding: 0,
}

function PaneHeaderBackButtonStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <PaneHeader
        title="Metronomy"
        backButton={
          <button type="button" data-testid="pane-back" aria-label="Back" style={bleedButtonStyle}>
            Back
          </button>
        }
        appendTitle={
          <button
            type="button"
            data-testid="pane-star"
            aria-label="Add to favorites"
            style={bleedButtonStyle}
          >
            Star
          </button>
        }
      />
    </TestWrapper>
  )
}

function verticalCentre(rect: DOMRect): number {
  return rect.top + rect.height / 2
}

function titleTextRect(): DOMRect {
  // Measure the glyph box, not the TitleText element: line-height: 0 on Root
  // collapses that element's border box and overflows the glyphs.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    if (walker.currentNode.textContent === 'Metronomy') {
      const range = document.createRange()
      range.selectNodeContents(walker.currentNode)
      return range.getBoundingClientRect()
    }
  }
  throw new Error('Expected to find the pane title text')
}

test(
  'vertically centres the back button with the title when appendTitle is present',
  {timeout: 30_000},
  async () => {
    // TestWrapper suspends on the mock workspace via use(); wait for the
    // header to land rather than wrapping render in act (unsupported here).
    void render(<PaneHeaderBackButtonStory />)

    await expect.poll(() => document.querySelector('[data-testid="pane-back"]')).not.toBeNull()
    await expect.poll(() => document.body.textContent?.includes('Metronomy')).toBe(true)

    const backButton = document.querySelector('[data-testid="pane-back"]')
    if (!backButton) {
      throw new Error('Expected to find the pane back button')
    }

    expect(
      Math.abs(
        verticalCentre(backButton.getBoundingClientRect()) - verticalCentre(titleTextRect()),
      ),
    ).toBeLessThan(4)
  },
)
