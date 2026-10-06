import {act, render, renderHook, screen} from '@testing-library/react'
import {type ReactNode, Suspense, use, useEffect} from 'react'
import {type ObservablePromise, preloadObservablePromise, useObservablePromise} from 'react-rx'
import {defer, Subject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../test/mocks/mockSanityClient'
import {type UpsellData, type UpsellDataResult} from '../../studio/upsell/types'
import {useClient} from '../useClient'
import {useProjectId} from '../useProjectId'
import {useUpsellData} from '../useUpsellData'

vi.mock('@sanity/telemetry/react', () => ({useTelemetry: vi.fn(() => ({log: vi.fn()}))}))
vi.mock('../useClient', () => ({useClient: vi.fn()}))
vi.mock('../useProjectId', () => ({useProjectId: vi.fn(() => 'test-project')}))

// oxlint-disable-next-line no-deprecated -- the hook identifier carries the deprecation of its versionless overload; this mocks the hook itself
const useClientMock = vi.mocked(useClient)
const useProjectIdMock = vi.mocked(useProjectId)

const upsellData: UpsellData = {
  _createdAt: '2024-01-01',
  _id: 'journey-test',
  _rev: '1',
  _type: 'journey',
  _updatedAt: '2024-01-01',
  id: 'journey-test',
  image: null,
  descriptionText: [],
  ctaButton: {text: 'Upgrade', url: '{{baseUrl}}/manage/project/{{projectId}}/plan'},
  secondaryButton: {text: 'Learn more', url: '{{baseUrl}}/docs/test'},
}

let response$: Subject<UpsellData | null>
let requestedUrls: string[]

beforeEach(() => {
  response$ = new Subject<UpsellData | null>()
  requestedUrls = []
  useProjectIdMock.mockReturnValue('test-project')
  const client = createMockSanityClientAsClient()
  // Cold like the real request observable: the request goes out on subscribe, not on creation
  vi.spyOn(client.observable, 'request').mockImplementation((options) =>
    defer(() => {
      requestedUrls.push(options.url ?? '')
      return response$
    }),
  )
  useClientMock.mockReturnValue(client)
})

const onHarnessRender = vi.fn()

function Leaf({promise}: {promise: ObservablePromise<UpsellDataResult>}) {
  const {upsellData: data, hasError} = use(promise)
  if (hasError) return <div data-testid="settled">error</div>
  if (!data) return <div data-testid="settled">no-data</div>
  return (
    <div data-testid="settled">
      {data.ctaButton.url} | {data.secondaryButton.url}
    </div>
  )
}

// The way a provider consumes the hook: the observable becomes a promise for a leaf, and the
// request starts when the provider commits
function Harness({dataUri = '/journey/test'}: {dataUri?: string}) {
  onHarnessRender()
  const {upsellData$} = useUpsellData({dataUri, feature: 'test'})
  const promise = useObservablePromise(upsellData$)
  useEffect(() => {
    void preloadObservablePromise(upsellData$)
  }, [upsellData$])
  return (
    <>
      <div data-testid="harness">rendered</div>
      <Suspense fallback={<div data-testid="pending">pending</div>}>
        <Leaf promise={promise} />
      </Suspense>
    </>
  )
}

// A mount whose leaf suspends must happen inside an awaited async `act` (see AGENTS.md)
async function mount(ui: ReactNode) {
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the leaf suspends on mount
  await act(async () => {
    render(ui)
  })
}

describe('useUpsellData', () => {
  it('returns a stable, cold observable: nothing is requested until it is subscribed', () => {
    const {result, rerender} = renderHook(() =>
      useUpsellData({dataUri: '/journey/test', feature: 'test'}),
    )
    const {upsellData$} = result.current

    rerender()

    // Same identity across renders: react-rx caches the promise by observable identity
    expect(result.current.upsellData$).toBe(upsellData$)
    expect(requestedUrls).toEqual([])
  })

  it('renders the caller at once and settles only the leaf once the request answers, with interpolated links', async () => {
    await mount(<Harness />)

    // The caller committed without waiting, which is what started the request; the leaf waits
    expect(screen.getByTestId('harness')).toBeInTheDocument()
    expect(screen.getByTestId('pending')).toBeInTheDocument()
    expect(screen.queryByTestId('settled')).not.toBeInTheDocument()
    // The hook's promise and the preload share one cache entry, so the request went out once
    expect(requestedUrls).toEqual(['/journey/test'])
    const harnessRendersBeforeAnswer = onHarnessRender.mock.calls.length

    await act(async () => {
      response$.next(upsellData)
      response$.complete()
    })

    expect(await screen.findByTestId('settled')).toHaveTextContent(
      'https://www.sanity.io/manage/project/test-project/plan | https://www.sanity.io/docs/test',
    )
    expect(screen.queryByTestId('pending')).not.toBeInTheDocument()
    // The answer reached the leaf without re-rendering the caller
    expect(onHarnessRender).toHaveBeenCalledTimes(harnessRendersBeforeAnswer)
  })

  it('settles with hasError when the request answers with nothing', async () => {
    await mount(<Harness />)

    await act(async () => {
      response$.next(null)
      response$.complete()
    })

    expect(await screen.findByTestId('settled')).toHaveTextContent('error')
  })

  it('settles with hasError instead of erroring when the request fails', async () => {
    await mount(<Harness />)

    await act(async () => {
      response$.error(new Error('Network down'))
    })

    expect(await screen.findByTestId('settled')).toHaveTextContent('error')
  })
})
