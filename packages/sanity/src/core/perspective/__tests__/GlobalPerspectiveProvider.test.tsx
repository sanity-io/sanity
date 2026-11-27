import {renderHook, waitFor} from '@testing-library/react'
import {type PropsWithChildren} from 'react'
import {BehaviorSubject} from 'rxjs'
import {route, RouterProvider} from 'sanity/router'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {type SingleWorkspace} from '../../config/types'
import {activeASAPRelease} from '../../releases/__fixtures__/release.fixture'
import {
  mockUseActiveReleases,
  useActiveReleasesMockReturn,
} from '../../releases/store/__tests__/__mocks/useActiveReleases.mock'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {SCHEDULES_TOOL_NAME} from '../../schedules/constants'
import {type VariantStoreState} from '../../variants/store/reducer'
import {GlobalPerspectiveProvider} from '../GlobalPerspectiveProvider'
import {usePerspective} from '../usePerspective'

const INITIAL_VARIANTS_STATE: VariantStoreState = {variants: new Map(), state: 'initialising'}
const variantsState$ = new BehaviorSubject<VariantStoreState>({
  variants: new Map(),
  state: 'loaded',
})

vi.mock('../../variants/store/useVariantsStore', () => ({
  useVariantsStore: () => ({
    state$: variantsState$,
    initialState: INITIAL_VARIANTS_STATE,
    dispatch: vi.fn(),
  }),
}))

vi.mock('../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(),
}))

const RELEASE_ID = getReleaseIdFromReleaseDocumentId(activeASAPRelease._id)
const router = route.create('/', [route.intents('/intent')])

async function renderWithPerspectiveLink(config: Partial<SingleWorkspace>) {
  const TestProvider = await createTestProvider({config})
  const onNavigate = vi.fn()

  function Wrapper({children}: PropsWithChildren) {
    return (
      <TestProvider>
        <RouterProvider
          router={router}
          state={{_searchParams: [['perspective', RELEASE_ID]]}}
          onNavigate={onNavigate}
        >
          <GlobalPerspectiveProvider>{children}</GlobalPerspectiveProvider>
        </RouterProvider>
      </TestProvider>
    )
  }

  const rendered = renderHook(() => usePerspective(), {wrapper: Wrapper})
  return {...rendered, onNavigate}
}

describe('GlobalPerspectiveProvider release links', () => {
  beforeEach(() => {
    mockUseActiveReleases.mockReturnValue({
      ...useActiveReleasesMockReturn,
      data: [activeASAPRelease],
      byId: new Map([[activeASAPRelease._id, activeASAPRelease]]),
    })
  })

  it('opens the release when a tools filter removes the releases tool', async () => {
    const {result, onNavigate} = await renderWithPerspectiveLink({
      tools: (prev) => prev.filter((tool) => tool.name !== SCHEDULES_TOOL_NAME),
    })

    expect(result.current.selectedPerspectiveName).toBe(RELEASE_ID)
    expect(result.current.selectedReleaseId).toBe(RELEASE_ID)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('falls back to the default and clears the link when releases are off', async () => {
    const {result, onNavigate} = await renderWithPerspectiveLink({releases: {enabled: false}})

    expect(result.current.selectedPerspectiveName).toBeUndefined()
    await waitFor(() => expect(onNavigate).toHaveBeenCalled())
    expect(onNavigate.mock.calls[0][0].path).not.toContain('perspective=')
  })
})
