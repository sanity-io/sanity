import {render, screen} from '@testing-library/react'
import {act, Suspense, use} from 'react'
import {NEVER, of} from 'rxjs'
import {
  HasUsedScheduledPublishingPromiseContext,
  ScheduledPublishingEnabledContext,
  ScheduledPublishingModePromiseContext,
} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {type SettledFeatures, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'
import {useHasUsedScheduledPublishingObservable} from '../../scheduledPublishing/tool/contexts/useHasUsedScheduledPublishing'
import {scheduledPublishing} from './index'

vi.mock('../../studio/workspace', () => ({
  useWorkspace: vi.fn(() => ({
    scheduledPublishing: {enabled: true, __internal__workspaceEnabled: false},
  })),
}))
vi.mock('../../hooks/useFeatureEnabled', async (importOriginal) => ({
  ...(await importOriginal()),
  useFeatureEnabledObservable: vi.fn(),
}))
vi.mock(
  '../../scheduledPublishing/tool/contexts/useHasUsedScheduledPublishing',
  async (importOriginal) => ({
    ...(await importOriginal()),
    useHasUsedScheduledPublishingObservable: vi.fn(),
  }),
)
// The provider also mounts the upsell provider, which needs the studio's client and telemetry;
// its own behavior is covered by useUpsellContext.test.tsx
vi.mock('../tool/contexts/SchedulePublishingUpsellProvider', () => ({
  SchedulePublishingUpsellProvider: ({children}: {children: React.ReactNode}) => children,
}))

const useFeatureEnabledObservableMock = vi.mocked(useFeatureEnabledObservable)
const useHasUsedScheduledPublishingObservableMock = vi.mocked(
  useHasUsedScheduledPublishingObservable,
)

const SchedulePublishingStudioProvider = scheduledPublishing().studio!.components!.provider!

/** Reads the three contexts the way the callsites do */
function useScheduledPublishingState() {
  const enabled = use(ScheduledPublishingEnabledContext)
  const modePromise = use(ScheduledPublishingModePromiseContext)
  const hasUsedPromise = use(HasUsedScheduledPublishingPromiseContext)
  const mode = modePromise ? use(modePromise) : null
  const hasUsed = mode !== null && hasUsedPromise ? use(hasUsedPromise) : false
  return `enabled:${enabled} mode:${mode} used:${hasUsed}`
}

function Probe() {
  return <span>{useScheduledPublishingState()}</span>
}

/** Reads the mode alone, the way the banner, the context menu and the preview do */
function ModeProbe() {
  const modePromise = use(ScheduledPublishingModePromiseContext)
  const mode = modePromise ? use(modePromise) : null
  return <span>mode:{String(mode)}</span>
}

const laterFallbackRendered = vi.fn()
function LaterFallback() {
  laterFallbackRendered()
  return <span>later:pending</span>
}
function Later() {
  return <span>later {useScheduledPublishingState()}</span>
}

async function renderProvider(features: Partial<SettledFeatures>, hasUsed: boolean | 'pending') {
  useFeatureEnabledObservableMock.mockReturnValue(
    of({enabled: false, features: [], error: null, ...features}),
  )
  useHasUsedScheduledPublishingObservableMock.mockReturnValue(
    hasUsed === 'pending' ? NEVER : of(hasUsed),
  )
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the probe suspends on a promise; React only resumes it inside an awaited act
  await act(async () => {
    render(
      <SchedulePublishingStudioProvider
        renderDefault={() => (
          <Suspense fallback={<span>pending</span>}>
            <Probe />
          </Suspense>
        )}
      >
        {null}
      </SchedulePublishingStudioProvider>,
    )
  })
}

describe('SchedulePublishingStudioProvider', () => {
  it('settles the default mode when the plan has the feature and the dataset has scheduled before', async () => {
    await renderProvider({enabled: true}, true)

    expect(await screen.findByText('enabled:true mode:default used:true')).toBeInTheDocument()
  })

  it('settles the upsell mode when the plan lacks the feature', async () => {
    await renderProvider({enabled: false}, true)

    expect(await screen.findByText('enabled:true mode:upsell used:true')).toBeInTheDocument()
  })

  it('settles the usage probe as not used on its own', async () => {
    await renderProvider({enabled: true}, false)

    expect(await screen.findByText('enabled:true mode:default used:false')).toBeInTheDocument()
  })

  it('settles a failed feature check as a null mode, independently of the usage probe', async () => {
    useFeatureEnabledObservableMock.mockReturnValue(
      of({enabled: false, features: [], error: new Error('Something went wrong')}),
    )
    useHasUsedScheduledPublishingObservableMock.mockReturnValue(NEVER)
    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the probes suspend on a promise; React only resumes them inside an awaited act
    await act(async () => {
      render(
        <SchedulePublishingStudioProvider
          renderDefault={() => (
            <>
              <Suspense fallback={<span>mode:pending</span>}>
                <ModeProbe />
              </Suspense>
              <Suspense fallback={<span>pending</span>}>
                <Probe />
              </Suspense>
            </>
          )}
        >
          {null}
        </SchedulePublishingStudioProvider>,
      )
    })

    // The mode has settled on its own, and a failed check is a complete answer: no callsite
    // waits for the probe once it has it
    expect(screen.getByText('mode:null')).toBeInTheDocument()
    expect(screen.getByText('enabled:true mode:null used:false')).toBeInTheDocument()
    expect(screen.queryByText('pending')).toBeNull()
  })

  it('settles both promises in place, so a leaf that mounts later reads them without suspending', async () => {
    useFeatureEnabledObservableMock.mockReturnValue(of({enabled: false, features: [], error: null}))
    useHasUsedScheduledPublishingObservableMock.mockReturnValue(of(true))
    // Nothing reads the promises while the checks answer
    const {rerender} = render(
      <SchedulePublishingStudioProvider renderDefault={() => <span>no leaf</span>}>
        {null}
      </SchedulePublishingStudioProvider>,
    )
    await act(() => Promise.resolve())

    // The tool, the document banner and the upsell dialog mount long after the checks answered;
    // the promises the contexts carry are the ones that settled, so `use()` reads them synchronously
    rerender(
      <SchedulePublishingStudioProvider
        renderDefault={() => (
          <Suspense fallback={<LaterFallback />}>
            <Later />
          </Suspense>
        )}
      >
        {null}
      </SchedulePublishingStudioProvider>,
    )

    expect(screen.getByText('later enabled:true mode:upsell used:true')).toBeInTheDocument()
    expect(laterFallbackRendered).not.toHaveBeenCalled()
  })

  it('reads as disabled, without suspending, where the plugin is not loaded', () => {
    // No Suspense boundary: a pending promise would throw here
    render(<Probe />)

    expect(screen.getByText('enabled:false mode:null used:false')).toBeInTheDocument()
  })
})
