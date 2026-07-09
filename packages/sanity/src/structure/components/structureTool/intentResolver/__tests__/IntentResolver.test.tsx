import {render, waitFor} from '@testing-library/react'
import {Component, type ReactNode} from 'react'
import {firstValueFrom, of, throwError} from 'rxjs'
import {filter} from 'rxjs/operators'
import {createRequestErrorChannel, type DocumentStore} from 'sanity'
import {StudioErrorHandlerContext} from 'sanity/_singletons'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {PaneResolutionError} from '../../../../structureResolvers'
import * as USE_STRUCTURE_TOOL from '../../../../useStructureTool'
import {IntentResolver} from '../IntentResolver'

const {mockNavigate, mockRouterState, mockResolveTypeForDocument, mockResolveIntent} = vi.hoisted(
  () => ({
    mockNavigate: vi.fn(),
    mockRouterState: {current: {} as Record<string, unknown>},
    mockResolveTypeForDocument: vi.fn(),
    mockResolveIntent: vi.fn(),
  }),
)

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useDocumentStore: () =>
    ({resolveTypeForDocument: mockResolveTypeForDocument}) as unknown as DocumentStore,
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({navigate: mockNavigate}),
  useRouterState: (selector: (state: Record<string, unknown>) => unknown) =>
    selector(mockRouterState.current),
}))

vi.mock('../../../../structureResolvers', async (importOriginal) => ({
  ...(await importOriginal()),
  resolveIntent: mockResolveIntent,
}))

vi.spyOn(USE_STRUCTURE_TOOL, 'useStructureTool').mockImplementation(
  () =>
    ({
      rootPaneNode: {},
      structureContext: {},
    }) as unknown as ReturnType<typeof USE_STRUCTURE_TOOL.useStructureTool>,
)

class Boundary extends Component<{children: ReactNode}, {error: unknown}> {
  state: {error: unknown} = {error: null}

  static getDerivedStateFromError(error: unknown) {
    return {error}
  }

  render() {
    return this.state.error ? null : this.props.children
  }
}

function socketTimeoutError() {
  return Object.assign(new Error('Socket timed out on request to https://x.api.sanity.io/…'), {
    code: 'ESOCKETTIMEDOUT',
  })
}

describe('IntentResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouterState.current = {intent: 'edit', params: {id: 'doc-id'}}
    mockResolveIntent.mockResolvedValue([])
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
    mockResolveTypeForDocument.mockReturnValue(throwError(socketTimeoutError))

    const {channel, boundary} = renderResolver()

    const claim = await firstValueFrom(channel.claim$.pipe(filter(Boolean)))
    expect(claim).toMatchObject({type: 'networkError', retryable: true})
    expect(boundary.current?.state.error).toBeNull()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('re-runs intent resolution when the claimed error is retried', async () => {
    mockResolveTypeForDocument
      .mockReturnValueOnce(throwError(socketTimeoutError))
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
    mockResolveTypeForDocument.mockReturnValue(throwError(socketTimeoutError))

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

  it('re-throws caller-domain errors into the error boundary', async () => {
    mockRouterState.current = {intent: 'edit', params: {}}

    const {channel, boundary} = renderResolver()

    await waitFor(() => {
      expect(boundary.current?.state.error).toBeInstanceOf(PaneResolutionError)
    })
    expect(await firstValueFrom(channel.claim$)).toBeUndefined()
  })
})
