import {render, renderHook, screen} from '@testing-library/react'
import {act, Suspense, use} from 'react'
import {NEVER, of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {type SettledFeatures, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'
import {useScheduledPublishingEnabled} from '../../scheduledPublishing/contexts/useScheduledPublishingEnabled'
import {useScheduledPublishingMode} from '../../scheduledPublishing/contexts/useScheduledPublishingMode'
import {
  type HasUsedScheduledPublishing,
  useHasUsedScheduledPublishingObservable,
} from '../../scheduledPublishing/tool/contexts/useHasUsedScheduledPublishing'
import {scheduledPublishing} from './index'

vi.mock('../../studio/workspace', () => ({
  useWorkspace: vi.fn(() => ({scheduledPublishing: {__internal__workspaceEnabled: false}})),
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

const USED: HasUsedScheduledPublishing = {used: true}
const NOT_USED: HasUsedScheduledPublishing = {used: false}

const SchedulePublishingStudioProvider = scheduledPublishing().studio!.components!.provider!

function Probe() {
  // Leaves read each promise with `use()`; both settle together
  const enabled = use(useScheduledPublishingEnabled())
  const mode = use(useScheduledPublishingMode())
  return (
    <span>
      enabled:{String(enabled)} mode:{String(mode)}
    </span>
  )
}

async function renderProvider(
  features: Partial<SettledFeatures>,
  hasUsed: HasUsedScheduledPublishing | 'pending',
) {
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
  it('settles the default mode when the feature is enabled and scheduled publishing has been used', async () => {
    await renderProvider({enabled: true}, USED)

    expect(await screen.findByText('enabled:true mode:default')).toBeInTheDocument()
  })

  it('settles the upsell mode when the plan lacks the feature but scheduled publishing has been used', async () => {
    await renderProvider({enabled: false}, USED)

    expect(await screen.findByText('enabled:true mode:upsell')).toBeInTheDocument()
  })

  it('settles as disabled when scheduled publishing has never been used', async () => {
    await renderProvider({enabled: true}, NOT_USED)

    expect(await screen.findByText('enabled:false mode:null')).toBeInTheDocument()
  })

  it('settles as disabled on a failed feature check without waiting for the usage probe', async () => {
    await renderProvider({enabled: false, error: new Error('Something went wrong')}, 'pending')

    expect(await screen.findByText('enabled:false mode:null')).toBeInTheDocument()
  })

  it('reads as disabled without the plugin, where the navbar tool menu renders regardless', () => {
    // Settled already, so `use()` reads them without suspending
    const enabled = renderHook(useScheduledPublishingEnabled).result.current
    const mode = renderHook(useScheduledPublishingMode).result.current

    expect(enabled).toMatchObject({status: 'fulfilled', value: false})
    expect(mode).toMatchObject({status: 'fulfilled', value: null})
    expect(renderHook(() => use(useScheduledPublishingEnabled())).result.current).toBe(false)
    expect(renderHook(() => use(useScheduledPublishingMode())).result.current).toBe(null)
  })
})
