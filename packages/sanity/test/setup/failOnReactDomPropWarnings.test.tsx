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
