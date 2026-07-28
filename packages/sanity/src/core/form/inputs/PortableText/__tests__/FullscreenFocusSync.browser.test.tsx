import {defineArrayMember, defineField, defineType, type Path} from '@sanity/types'
import {useState} from 'react'
import {type InputProps, type PortableTextInputProps} from 'sanity'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

const EMPTY_PATH: Path = []

// A document with a sibling `title` field and a `body` PTE that starts fullscreen.
const schemaTypes = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({type: 'string', name: 'title'}),
      defineField({
        type: 'array',
        name: 'body',
        of: [defineArrayMember({type: 'block'})],
        components: {
          input: (inputProps: InputProps) =>
            inputProps.renderDefault({
              ...inputProps,
              initialActive: true,
              initialFullscreen: true,
            } as PortableTextInputProps),
        },
      }),
    ],
  }),
]

function Story() {
  const [focusPath, setFocusPath] = useState<Path>(EMPTY_PATH)
  return (
    <TestWrapper schemaTypes={schemaTypes}>
      {/* A control that moves document focus to a sibling field outside the PTE. */}
      <button type="button" data-testid="focus-sibling" onClick={() => setFocusPath(['title'])}>
        focus title
      </button>
      <TestForm focusPath={focusPath} />
    </TestWrapper>
  )
}

describe('Portable Text Input: fullscreen focus sync', () => {
  // Regression test for the FullscreenPTEFocusSync fix: collapsing a fullscreen
  // PTE when focus moves to a non-descendant field must actually flip the
  // editor's *visual* state, not just clear the fullscreen context. Before the
  // companion change in PortableTextInput, clearing the context for a stable
  // path never updated the local isFullscreen, so the editor stayed expanded.
  it('collapses an expanded PTE when document focus moves to a non-descendant field', async () => {
    void render(<Story />)

    // The body editor starts fullscreen — the toolbar shows the collapse control.
    await expect.element(page.getByTestId('fullscreen-button-collapse')).toBeVisible()

    // Mimic a programmatic focus change (e.g. a validation-error deep-link)
    // landing on a sibling field outside the editor. The fullscreen overlay
    // intercepts real pointer events, so blur the editor and fire the control
    // directly.
    const btn = page.getByTestId('focus-sibling').element() as HTMLElement
    ;(document.activeElement as HTMLElement | null)?.blur()
    btn.dispatchEvent(new MouseEvent('click', {bubbles: true}))

    // The editor must collapse back to inline: the expand control returns and the
    // collapse control is gone.
    await expect.element(page.getByTestId('fullscreen-button-expand')).toBeVisible()
    await expect.element(page.getByTestId('fullscreen-button-collapse')).not.toBeInTheDocument()
  })
})
