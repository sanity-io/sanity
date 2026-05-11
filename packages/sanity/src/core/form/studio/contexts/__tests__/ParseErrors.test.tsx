import {type Path} from '@sanity/types'
import {render} from '@testing-library/react'
import {act} from 'react'
import {describe, expect, it} from 'vitest'

import {ParseErrorsProvider, useParseErrors, useReportParseError} from '../ParseErrors'

function Reporter({path, error}: {path: Path; error: string | null}) {
  useReportParseError(path, error)
  return null
}

function Observer({onSnapshot}: {onSnapshot: (snapshot: Record<string, unknown>) => void}) {
  onSnapshot(useParseErrors())
  return null
}

describe('useReportParseError', () => {
  it('registers a parse error in the provider state', () => {
    let latest: Record<string, unknown> = {}
    render(
      <ParseErrorsProvider>
        <Reporter path={['publishedAt']} error="Invalid date" />
        <Observer
          onSnapshot={(s) => {
            latest = s
          }}
        />
      </ParseErrorsProvider>,
    )

    expect(latest).toEqual({
      publishedAt: {path: ['publishedAt'], message: 'Invalid date'},
    })
  })

  it('clears the entry when error transitions to null', () => {
    let latest: Record<string, unknown> = {}
    const onSnapshot = (s: Record<string, unknown>) => {
      latest = s
    }

    const {rerender} = render(
      <ParseErrorsProvider>
        <Reporter path={['publishedAt']} error="Invalid date" />
        <Observer onSnapshot={onSnapshot} />
      </ParseErrorsProvider>,
    )
    expect(latest).toHaveProperty('publishedAt')

    rerender(
      <ParseErrorsProvider>
        <Reporter path={['publishedAt']} error={null} />
        <Observer onSnapshot={onSnapshot} />
      </ParseErrorsProvider>,
    )
    expect(latest).not.toHaveProperty('publishedAt')
  })

  it('clears the entry on unmount', () => {
    let latest: Record<string, unknown> = {}
    const Reader = () => {
      latest = useParseErrors()
      return null
    }

    const {rerender} = render(
      <ParseErrorsProvider>
        <Reporter path={['publishedAt']} error="Invalid date" />
        <Reader />
      </ParseErrorsProvider>,
    )
    expect(latest).toHaveProperty('publishedAt')

    act(() => {
      rerender(
        <ParseErrorsProvider>
          <Reader />
        </ParseErrorsProvider>,
      )
    })
    expect(latest).not.toHaveProperty('publishedAt')
  })

  it('is a no-op outside a ParseErrorsProvider', () => {
    expect(() => {
      render(<Reporter path={['publishedAt']} error="Invalid date" />)
    }).not.toThrow()
  })
})
