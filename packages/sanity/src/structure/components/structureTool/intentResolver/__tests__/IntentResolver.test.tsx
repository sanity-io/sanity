import {act, render, waitFor} from '@testing-library/react'
import {Component, type ReactNode, useMemo, useSyncExternalStore} from 'react'
import {firstValueFrom, from, NEVER, Observable, of, throwError} from 'rxjs'
import {filter} from 'rxjs/operators'
import {createRequestErrorChannel, type DocumentStore} from 'sanity'
import {StudioErrorHandlerContext} from 'sanity/_singletons'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {PaneResolutionError} from '../../../../structureResolvers/PaneResolutionError'
import * as USE_STRUCTURE_TOOL from '../../../../useStructureTool'
import {IntentResolver} from '../IntentResolver'

const {mockNavigate, mockRouter, mockResolveTypeForDocument, mockResolveIntent, mockEditState} =
  vi.hoisted(() => {
    const listeners = new Set<() => void>()
    return {
      mockNavigate: vi.fn(),
      mockRouter: {
        state: {} as Record<string, unknown>,
        setState(state: Record<string, unknown>) {
          this.state = state
          listeners.forEach((listener) => listener())
        },
        subscribe(listener: () => void) {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
      },
      mockResolveTypeForDocument: vi.fn(),
      mockResolveIntent: vi.fn(),
      mockEditState: vi.fn(),
    }
  })

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useDocumentStore: () =>
    ({
      resolveTypeForDocument: mockResolveTypeForDocument,
      pair: {editState: mockEditState},
    }) as unknown as DocumentStore,
}))

function useMockRouterState() {
  return useSyncExternalStore(
    (listener) => mockRouter.subscribe(listener),
    () => mockRouter.state,
  )
}

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => {
    const state = useMockRouterState()
    return {navigate: mockNavigate, state}
  },
  useRouterState: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = useMockRouterState()
    return useMemo(() => selector(state), [selector, state])
  },
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return {promise, resolve}
}

vi.mock('../../../../structureResolvers/resolveIntent', async (importOriginal) => ({
  ...(await importOriginal()),
  resolveIntent: mockResolveIntent,
}))

const mockStructureTool = {
  rootPaneNode: {},
  structureContext: {},
} as unknown as ReturnType<typeof USE_STRUCTURE_TOOL.useStructureTool>

vi.spyOn(USE_STRUCTURE_TOOL, 'useStructureTool').mockImplementation(() => mockStructureTool)

class Boundary extends Component<{children: ReactNode}, {error: unknown}> {
  state: {error: unknown} = {error: null}

  static getDerivedStateFromError(error: unknown) {
    return {error}
  }

  render() {
    return this.state.error ? null : this.props.children
  }
}

function timeoutError() {
  return Object.assign(new Error('The operation was aborted due to timeout'), {
    name: 'TimeoutError',
  })
}

describe('IntentResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouter.state = {intent: 'edit', params: {id: 'doc-id'}}
    mockNavigate.mockImplementation((state: Record<string, unknown>) => mockRouter.setState(state))
    mockResolveIntent.mockImplementation(({documentType}) =>
      documentType ? firstValueFrom(documentType).then(() => []) : Promise.resolve([]),
    )
    mockEditState.mockReturnValue(NEVER)
  })

  function renderResolver(channel = createRequestErrorChannel()) {
    const boundary = {current: null as Boundary | null}
    const {unmount} = render(
      <StudioErrorHandlerContext.Provider value={channel}>
        <Boundary
          ref={(instance) => {
            boundary.current = instance
          }}
        >
          <IntentResolver />
        </Boundary>
      </StudioErrorHandlerContext.Provider>,
    )
    return {channel, boundary, unmount}
  }

  it('delegates infrastructure failures to the request-error channel instead of crashing', async () => {
    mockResolveTypeForDocument.mockReturnValue(throwError(timeoutError))

    const {channel, boundary} = renderResolver()

    const claim = await firstValueFrom(channel.claim$.pipe(filter(Boolean)))
    expect(claim).toMatchObject({type: 'networkError', retryable: true})
    expect(boundary.current?.state.error).toBeNull()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('re-runs intent resolution when the claimed error is retried', async () => {
    mockResolveTypeForDocument
      .mockReturnValueOnce(throwError(timeoutError))
      .mockReturnValueOnce(of('author'))

    const {channel} = renderResolver()

    await firstValueFrom(channel.claim$.pipe(filter(Boolean)))
    channel.retry()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({panes: []}, {replace: true})
    })
    expect(mockResolveTypeForDocument).toHaveBeenCalledTimes(2)
  })

  it('does not re-fetch when the claimed error is retried after unmount', async () => {
    mockResolveTypeForDocument.mockReturnValue(throwError(timeoutError))

    const {channel, unmount} = renderResolver()

    await firstValueFrom(channel.claim$.pipe(filter(Boolean)))
    unmount()
    channel.retry()

    expect(await firstValueFrom(channel.claim$)).toBeUndefined()
    // let the re-run of the (now cancelled) thunk settle before asserting
    // that it didn't issue another request
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mockResolveTypeForDocument).toHaveBeenCalledTimes(1)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('starts loading the document while the intent resolves', async () => {
    mockResolveTypeForDocument.mockReturnValue(of('author'))
    mockResolveIntent.mockReturnValue(new Promise(() => undefined))
    let documentSubscriptions = 0
    mockEditState.mockReturnValue(
      new Observable(() => {
        documentSubscriptions++
        return () => {
          documentSubscriptions--
        }
      }),
    )

    const {unmount} = renderResolver()

    await waitFor(() => expect(documentSubscriptions).toBe(1))
    expect(mockEditState).toHaveBeenCalledWith('doc-id', 'author')

    unmount()
    expect(documentSubscriptions).toBe(0)
  })

  it('re-throws caller-domain errors into the error boundary', async () => {
    mockRouter.state = {intent: 'edit', params: {}}

    const {channel, boundary} = renderResolver()

    await waitFor(() => {
      expect(boundary.current?.state.error).toBeInstanceOf(PaneResolutionError)
    })
    expect(await firstValueFrom(channel.claim$)).toBeUndefined()
  })

  describe('opening the document while the intent resolves', () => {
    const resolvedPanes = [[{id: 'books'}], [{id: 'doc-id', params: {}}]]

    beforeEach(() => {
      mockRouter.state = {intent: 'edit', params: {id: 'doc-id', type: 'book'}}
      mockResolveTypeForDocument.mockReturnValue(of('book'))
    })

    it('navigates straight to a resolution that settles within the grace period', async () => {
      mockResolveIntent.mockResolvedValue(resolvedPanes)

      renderResolver()

      await waitFor(() => expect(mockNavigate).toHaveBeenCalled())
      expect(mockNavigate.mock.calls).toEqual([[{panes: resolvedPanes}, {replace: true}]])
    })

    it('opens the document in a resolving pane, then moves it to the resolved path', async () => {
      const resolution = deferred<typeof resolvedPanes>()
      mockResolveIntent.mockReturnValue(resolution.promise)

      renderResolver()

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          {panes: [[{id: '__resolve__doc-id', params: {type: 'book'}, payload: undefined}]]},
          {replace: true},
        ),
      )

      // the user picks another view while the structure is still resolving
      act(() => {
        mockRouter.setState({
          panes: [[{id: '__resolve__doc-id', params: {type: 'book', view: 'preview'}}]],
        })
      })

      await act(async () => resolution.resolve(resolvedPanes))

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(2))
      expect(mockNavigate).toHaveBeenLastCalledWith(
        {panes: [[{id: 'books'}], [{id: 'doc-id', params: {view: 'preview'}, payload: undefined}]]},
        {replace: true},
      )
      // the resolving pane reuses the resolution the intent started
      expect(mockResolveIntent).toHaveBeenCalledTimes(1)
    })

    it('opens the resolving pane once the type of a link without one is known', async () => {
      mockRouter.state = {intent: 'edit', params: {id: 'doc-id'}}
      const documentType = deferred<string>()
      mockResolveTypeForDocument.mockReturnValue(from(documentType.promise))
      const resolution = deferred<typeof resolvedPanes>()
      mockResolveIntent.mockImplementation(({documentType: type$}) =>
        firstValueFrom(type$).then(() => resolution.promise),
      )

      renderResolver()

      await new Promise((resolve) => setTimeout(resolve, 400))
      expect(mockNavigate).not.toHaveBeenCalled()

      await act(async () => documentType.resolve('book'))
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          {panes: [[{id: '__resolve__doc-id', params: {type: 'book'}, payload: undefined}]]},
          {replace: true},
        ),
      )

      await act(async () => resolution.resolve(resolvedPanes))
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(2))
      expect(mockNavigate).toHaveBeenLastCalledWith(
        {panes: [[{id: 'books'}], [{id: 'doc-id', params: undefined, payload: undefined}]]},
        {replace: true},
      )
      expect(mockResolveTypeForDocument).toHaveBeenCalledTimes(1)
      expect(mockResolveIntent).toHaveBeenCalledTimes(1)
    })

    it('drops the resolution when the user navigates away from the resolving pane', async () => {
      const resolution = deferred<typeof resolvedPanes>()
      mockResolveIntent.mockReturnValue(resolution.promise)

      renderResolver()

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1))
      act(() => {
        mockRouter.setState({panes: [[{id: 'authors'}]]})
      })
      await act(async () => resolution.resolve(resolvedPanes))
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockNavigate).toHaveBeenCalledTimes(1)
      expect(mockResolveIntent).toHaveBeenCalledTimes(1)
    })

    it('keeps the intent, template and payload of a create intent', async () => {
      mockRouter.state = {
        intent: 'create',
        params: {id: 'new-id', type: 'book', template: 'book-by-author'},
        payload: {authorId: 'grrm'},
      }
      const resolution = deferred<typeof resolvedPanes>()
      mockResolveIntent.mockReturnValue(resolution.promise)

      renderResolver()

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          {
            panes: [
              [
                {
                  id: '__resolve__new-id',
                  params: {type: 'book', template: 'book-by-author', intent: 'create'},
                  payload: {authorId: 'grrm'},
                },
              ],
            ],
          },
          {replace: true},
        ),
      )
      expect(mockResolveIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          intent: 'create',
          params: {id: 'new-id', type: 'book', template: 'book-by-author'},
          payload: {authorId: 'grrm'},
        }),
      )
    })

    it('resolves a resolving pane that was opened directly, for example on reload', async () => {
      mockRouter.state = {panes: [[{id: '__resolve__doc-id', params: {type: 'book'}}]]}
      mockResolveIntent.mockResolvedValue(resolvedPanes)

      renderResolver()

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          {panes: [[{id: 'books'}], [{id: 'doc-id', params: undefined, payload: undefined}]]},
          {replace: true},
        ),
      )
      expect(mockResolveIntent).toHaveBeenCalledWith(
        expect.objectContaining({intent: 'edit', params: {id: 'doc-id', type: 'book'}}),
      )
    })
  })
})
