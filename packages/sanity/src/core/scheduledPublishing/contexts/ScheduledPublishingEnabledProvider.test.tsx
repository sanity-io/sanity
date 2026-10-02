import {renderHook} from '@testing-library/react'
import {type ObservablePromise} from 'react-rx'
import {
  HasUsedScheduledPublishingPromiseContext,
  ScheduledPublishingFeaturePromiseContext,
} from 'sanity/_singletons'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type SettledFeatures} from '../../hooks/useFeatureEnabled'
import {useWorkspace} from '../../studio/workspace'
import {type HasUsedScheduledPublishing} from '../tool/contexts/useHasUsedScheduledPublishing'
import {
  ScheduledPublishingEnabledProvider,
  useScheduledPublishingEnabled,
} from './ScheduledPublishingEnabledProvider'

vi.mock('../../studio/workspace', () => ({
  useWorkspace: vi.fn().mockReturnValue({}),
}))

const useWorkspaceMock = useWorkspace as ReturnType<typeof vi.fn>

/** A settled promise, as the provider provides it once resolved */
function settled<T>(value: T): ObservablePromise<T> {
  return Object.assign(Promise.resolve(value), {status: 'fulfilled' as const, value})
}

function feature(value: Partial<SettledFeatures>): ObservablePromise<SettledFeatures> {
  return settled({enabled: false, features: [], error: null, ...value})
}

const USED: HasUsedScheduledPublishing = {used: true}
const NOT_USED: HasUsedScheduledPublishing = {used: false}

/** A probe that never answers, as during an API outage */
function pending<T>(): ObservablePromise<T> {
  return Object.assign(new Promise<T>(() => undefined), {status: 'pending' as const})
}

function renderEnabled(
  featureEnabledPromise: ObservablePromise<SettledFeatures>,
  hasUsed: HasUsedScheduledPublishing | ObservablePromise<HasUsedScheduledPublishing>,
) {
  return renderHook(useScheduledPublishingEnabled, {
    wrapper: ({children}) => (
      <ScheduledPublishingFeaturePromiseContext value={featureEnabledPromise}>
        <HasUsedScheduledPublishingPromiseContext
          value={hasUsed instanceof Promise ? hasUsed : settled(hasUsed)}
        >
          <ScheduledPublishingEnabledProvider>{children}</ScheduledPublishingEnabledProvider>
        </HasUsedScheduledPublishingPromiseContext>
      </ScheduledPublishingFeaturePromiseContext>
    ),
  })
}

describe('ScheduledPublishingEnabledProvider - previously used', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not show scheduled publishing if user opt out and the feature is not enabled (any plan)', () => {
    useWorkspaceMock.mockReturnValue({scheduledPublishing: {enabled: false}})

    const value = renderEnabled(feature({enabled: false}), NOT_USED)

    expect(value.result.current).toEqual({
      enabled: false,
      mode: null,
      hasUsedScheduledPublishing: NOT_USED,
    })
  })
  it('should not show scheduled publishing  if user opt out and the feature is enabled (any plan)', () => {
    useWorkspaceMock.mockReturnValue({scheduledPublishing: {enabled: false}})

    const value = renderEnabled(feature({enabled: true}), NOT_USED)

    expect(value.result.current).toEqual({
      enabled: false,
      mode: null,
      hasUsedScheduledPublishing: NOT_USED,
    })
  })

  it('should show default mode if user hasnt opted out and the feature is enabled (growth or above)', () => {
    useWorkspaceMock.mockReturnValue({scheduledPublishing: {enabled: true}})

    const value = renderEnabled(feature({enabled: true}), USED)

    expect(value.result.current).toEqual({
      enabled: true,
      mode: 'default',
      hasUsedScheduledPublishing: USED,
    })
  })

  it('should show upsell mode if user has not opt out and the feature is not enabled (free plans)', () => {
    useWorkspaceMock.mockReturnValue({scheduledPublishing: {enabled: true}})

    const value = renderEnabled(feature({enabled: false}), USED)

    expect(value.result.current).toEqual({
      enabled: true,
      mode: 'upsell',
      hasUsedScheduledPublishing: USED,
    })
  })

  it('should not show the plugin if the feature check has an error, without waiting for the usage probe', () => {
    useWorkspaceMock.mockReturnValue({scheduledPublishing: {enabled: true}})

    const value = renderEnabled(
      feature({enabled: false, error: new Error('Something went wrong')}),
      pending<HasUsedScheduledPublishing>(),
    )

    expect(value.result.current).toEqual({
      enabled: false,
      mode: null,
      hasUsedScheduledPublishing: NOT_USED,
    })
  })
})

describe('ScheduledPublishingEnabledProvider - not previously used', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not show if they have not used it before and have not opted in', () => {
    useWorkspaceMock.mockReturnValue({
      scheduledPublishing: {enabled: true, __internal__workspaceEnabled: false},
    })

    const value = renderEnabled(feature({enabled: true}), NOT_USED)

    expect(value.result.current).toEqual({
      enabled: false,
      mode: null,
      hasUsedScheduledPublishing: NOT_USED,
    })
  })

  it('should show default mode if they have not used it before and opted in', () => {
    useWorkspaceMock.mockReturnValue({
      scheduledPublishing: {enabled: true, __internal__workspaceEnabled: true},
    })

    // Opted in: the "used" probe is skipped and reports used, see useHasUsedScheduledPublishingObservable
    const value = renderEnabled(feature({enabled: true}), USED)

    expect(value.result.current).toEqual({
      enabled: true,
      mode: 'default',
      hasUsedScheduledPublishing: USED,
    })
  })

  it('should show upsell mode if they have not used it before and opted in, and feature is not available (free plans)', () => {
    useWorkspaceMock.mockReturnValue({
      scheduledPublishing: {enabled: true, __internal__workspaceEnabled: true},
    })

    const value = renderEnabled(feature({enabled: false}), USED)

    expect(value.result.current).toEqual({
      enabled: true,
      mode: 'upsell',
      hasUsedScheduledPublishing: USED,
    })
  })
})
