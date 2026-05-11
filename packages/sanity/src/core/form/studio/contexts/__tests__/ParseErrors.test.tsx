import {type Path} from '@sanity/types'
import {render} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {ParseErrorsProvider, useParseErrors, useReportParseError} from '../ParseErrors'

function Reporter({path, error}: {path: Path; error: string | null}) {
  useReportParseError(path, error)
  return null
}

function ErrorDump() {
  const errors = useParseErrors()
  return <div data-testid="dump">{JSON.stringify(errors)}</div>
}

function readDump(container: HTMLElement): Record<string, {message: string}> {
  return JSON.parse(container.querySelector('[data-testid="dump"]')!.textContent || '{}')
}

describe('useReportParseError', () => {
  it('registers a parse error in the provider state', () => {
    const {container} = render(
      <ParseErrorsProvider>
        <Reporter path={['publishedAt']} error="Invalid date" />
        <ErrorDump />
      </ParseErrorsProvider>,
    )

    expect(readDump(container)).toEqual({publishedAt: {message: 'Invalid date'}})
  })

  it('clears the entry when error transitions to null', () => {
    const {container, rerender} = render(
      <ParseErrorsProvider>
        <Reporter path={['publishedAt']} error="Invalid date" />
        <ErrorDump />
      </ParseErrorsProvider>,
    )
    expect(readDump(container)).toHaveProperty('publishedAt')

    rerender(
      <ParseErrorsProvider>
        <Reporter path={['publishedAt']} error={null} />
        <ErrorDump />
      </ParseErrorsProvider>,
    )
    expect(readDump(container)).not.toHaveProperty('publishedAt')
  })

  it('clears the entry on unmount', () => {
    const {container, rerender} = render(
      <ParseErrorsProvider>
        <Reporter path={['publishedAt']} error="Invalid date" />
        <ErrorDump />
      </ParseErrorsProvider>,
    )
    expect(readDump(container)).toHaveProperty('publishedAt')

    rerender(
      <ParseErrorsProvider>
        <ErrorDump />
      </ParseErrorsProvider>,
    )
    expect(readDump(container)).not.toHaveProperty('publishedAt')
  })

  it('is a no-op outside a ParseErrorsProvider', () => {
    expect(() => {
      render(<Reporter path={['publishedAt']} error="Invalid date" />)
    }).not.toThrow()
  })
})
