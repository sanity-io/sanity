import {render, screen} from '@testing-library/react'
import {type Context, use} from 'react'
import {type DocumentIdContextValue} from 'sanity/_singletons'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

/**
 * A second bundle of `sanity` on a page is a second instance of `sanity/_singletons`. Resetting
 * the module registry before importing gives the test the same thing.
 */
async function loadCopy() {
  vi.resetModules()
  return import('sanity/_singletons')
}

function DocumentId({
  context,
  testId,
}: {
  context: Context<DocumentIdContextValue | null>
  testId: string
}) {
  return <span data-testid={testId}>{use(context)?.id ?? 'no document'}</span>
}

describe('sanity/_singletons', () => {
  beforeEach(() => {
    // The global registry this guards against skipped itself under jsdom's user agent
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('two copies of sanity render side by side, each reading its own provider, and leave the global scope alone', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const globals = Reflect.ownKeys(globalThis)
    const copyA = await loadCopy()
    const copyB = await loadCopy()

    expect(copyB.DocumentIdContext).not.toBe(copyA.DocumentIdContext)
    expect(Reflect.ownKeys(globalThis)).toEqual(globals)

    render(
      <copyA.DocumentIdContext value={{id: 'document in copy A'}}>
        <copyB.DocumentIdContext value={{id: 'document in copy B'}}>
          <DocumentId context={copyA.DocumentIdContext} testId="a" />
          <DocumentId context={copyB.DocumentIdContext} testId="b" />
        </copyB.DocumentIdContext>
        <DocumentId context={copyB.DocumentIdContext} testId="b-outside" />
      </copyA.DocumentIdContext>,
    )

    expect(screen.getByTestId('a')).toHaveTextContent('document in copy A')
    expect(screen.getByTestId('b')).toHaveTextContent('document in copy B')
    expect(screen.getByTestId('b-outside')).toHaveTextContent('no document')
    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })
})
