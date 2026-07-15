import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {TagInput} from './tagInput'

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

// Reproduces https://github.com/sanity-io/sanity/issues/13429
//
// When an array field with `options.layout: 'tags'` is rendered `readOnly`,
// the text inside each tag pill should appear visually centered, matching the
// editable case. Today it hugs the left edge of the pill.
//
// In `packages/sanity/src/core/form/components/tagInput/tagInput.tsx`, the
// `Tag` sub-component renders the text in a Box with `paddingLeft={2}` and
// relies on the trailing remove `<Button>` to provide the right-hand visual
// spacing. That button is only rendered when `enabled = !disabled && !readOnly`.
// When `readOnly` is true the button disappears but the Box keeps its
// left-only padding, so the text sits flush against the left edge.
function renderTag({readOnly}: {readOnly: boolean}) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <TagInput readOnly={readOnly} value={[{value: 'Robert De Niro'}]} />
    </ThemeProvider>,
  )
}

function getTagBox(tagValue: string): HTMLElement {
  // The Text primitive wrapping the tag value is a descendant of the padding
  // Box that we care about. Walk up to that Box.
  const textEl = screen.getByText(tagValue)
  const box = textEl.closest('[data-ui="Box"]') as HTMLElement | null
  if (!box) {
    throw new Error(`Could not find [data-ui="Box"] ancestor of "${tagValue}"`)
  }
  return box
}

describe('TagInput tag padding (regression: #13429)', () => {
  it('renders symmetric horizontal padding on the tag text box when readOnly', () => {
    renderTag({readOnly: true})

    const box = getTagBox('Robert De Niro')
    const style = window.getComputedStyle(box)
    const left = style.paddingLeft
    const right = style.paddingRight

    // Both should be non-empty and non-zero. On `main` the readOnly Tag has
    // `paddingLeft={2}` and no right-side padding, so `right` is empty/'0px'
    // and the text is left-shifted inside the pill.
    expect(left).not.toBe('')
    expect(left).not.toBe('0px')

    // The regression assertion: right padding must match left padding so the
    // pill text is visually centered when the remove button is not rendered.
    expect(right).toBe(left)
  })

  it('also renders symmetric horizontal padding when disabled', () => {
    // `enabled = !disabled && !readOnly` — the disabled branch has the same
    // structural issue as readOnly (remove button hidden, so the Box needs
    // its own right-side padding to keep the text centered).
    render(
      <ThemeProvider theme={studioTheme}>
        <TagInput disabled value={[{value: 'Robert De Niro'}]} />
      </ThemeProvider>,
    )

    const box = getTagBox('Robert De Niro')
    const style = window.getComputedStyle(box)
    expect(style.paddingRight).toBe(style.paddingLeft)
  })
})
