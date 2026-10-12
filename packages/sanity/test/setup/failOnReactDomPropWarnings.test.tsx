import {takeDomPropWarnings} from '@repo/test-config/vitest/failOnReactDomPropWarnings'
import {render} from '@testing-library/react'
import {styled} from 'styled-components'
import {describe, expect, it, vi} from 'vitest'

// `environment.ts` installs the guard for every test in this project, so these check it against the
// react-dom and styled-components builds the suite renders with. Both warn once per prop name in a
// test file, so each test leaks a name of its own.
describe('failOnReactDomPropWarnings', () => {
  it('captures what react-dom reports about a prop it does not recognize', () => {
    render(
      <div
        // @ts-expect-error -- a prop that no DOM element has
        leakedCamelCase="yes"
      />,
    )

    expect(takeDomPropWarnings()).toEqual([
      expect.stringMatching(
        /^React does not recognize the `leakedCamelCase` prop on a DOM element/,
      ),
    ])
  })

  it('captures what react-dom reports about several props of one element at once', () => {
    render(
      <div
        // @ts-expect-error -- props that no DOM element has
        leakedhandler={() => {}}
        leakedsymbol={Symbol('leaked')}
      />,
    )

    expect(takeDomPropWarnings()).toEqual([
      expect.stringMatching(
        /^Invalid values for props `leakedhandler`, `leakedsymbol` on <div> tag/,
      ),
    ])
  })

  it('captures what react-dom reports about the props it reserves', () => {
    render(
      <>
        <div
          // @ts-expect-error -- React has no `onFocusIn` event
          onFocusIn={() => {}}
        />
        <div
          // @ts-expect-error -- React sets inner HTML through `dangerouslySetInnerHTML`
          innerHTML="<b>leaked</b>"
        />
        <div
          // @ts-expect-error -- React reserves `aria` for future use
          aria="leaked"
        />
        <div
          // @ts-expect-error -- `is` names a customized built-in element
          is={1}
        />
        <div style={{width: Infinity}} />
      </>,
    )

    expect(takeDomPropWarnings()).toEqual([
      expect.stringMatching(/^React uses onFocus and onBlur instead of onFocusIn and onFocusOut/),
      expect.stringMatching(/^Directly setting property `innerHTML` is not permitted/),
      expect.stringMatching(/^The `aria` attribute is reserved for future use in React/),
      expect.stringMatching(/^Received a `number` for a string attribute `is`/),
      '`Infinity` is an invalid value for the `width` css style property.',
    ])
  })

  it('captures an object that reaches an attribute', () => {
    render(
      <div
        // @ts-expect-error -- a prop that no DOM element has
        leakedobject={{type: 'author'}}
      />,
    )

    expect(takeDomPropWarnings()).toEqual([
      'Attribute `leakedobject` on <div> was set to "[object Object]": an object-valued prop reached the DOM element.',
    ])
  })

  it('captures an array that reaches an attribute', () => {
    render(
      <div
        // @ts-expect-error -- a prop that no DOM element has, here the tuple form of intent parameters
        leakedparams={[{id: 'author'}, {view: 'json'}]}
      />,
    )

    expect(takeDomPropWarnings()).toEqual([
      'Attribute `leakedparams` on <div> was set to "[object Object],[object Object]" (Array): an object-valued prop reached the DOM element.',
    ])
  })

  it('captures a date that reaches an attribute', () => {
    render(
      <div
        // @ts-expect-error -- a prop that no DOM element has
        leakeddate={new Date(0)}
      />,
    )

    expect(takeDomPropWarnings()).toEqual([
      expect.stringMatching(
        /^Attribute `leakeddate` on <div> was set to "[^"]+" \(Date\): an object-valued prop/,
      ),
    ])
  })

  it('captures what styled-components reports about a prop it passes to the DOM', () => {
    const Box = styled.div<{leakedtone: string}>``
    // styled-components only warns in development.
    vi.stubEnv('NODE_ENV', 'development')
    try {
      render(<Box leakedtone="primary" />)
    } finally {
      vi.unstubAllEnvs()
    }

    expect(takeDomPropWarnings()).toEqual([
      expect.stringMatching(/^styled-components: it looks like an unknown prop "leakedtone"/),
    ])
  })

  it.fails('fails the test in which a prop leaked', () => {
    render(
      <div
        // @ts-expect-error -- a prop that no DOM element has
        leakedUntaken="yes"
      />,
    )
  })
})
