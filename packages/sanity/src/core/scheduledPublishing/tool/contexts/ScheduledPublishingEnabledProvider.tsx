import {useContext, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, type Observable, of} from 'rxjs'
import {ScheduledPublishingEnabledContext} from 'sanity/_singletons'

import {useClient} from '../../../hooks/useClient'
import {useFeatureEnabled} from '../../../hooks/useFeatureEnabled'
import {useWorkspace} from '../../../studio/workspace'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {type Schedule} from '../../types'

interface HasUsedScheduledPublishing {
  used: boolean
  loading: boolean
}
const HAS_USED_SCHEDULED_PUBLISHING: HasUsedScheduledPublishing = {used: false, loading: true}

/**
 * @internal
 */
export type ScheduledPublishingEnabledContextValue =
  | {
      enabled: false
      mode: null
      hasUsedScheduledPublishing: HasUsedScheduledPublishing
    }
  | {
      enabled: true
      mode: 'default' | 'upsell'
      hasUsedScheduledPublishing: HasUsedScheduledPublishing
    }

interface ScheduledPublishingEnabledProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */

export function ScheduledPublishingEnabledProvider({
  children,
}: ScheduledPublishingEnabledProviderProps) {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const {enabled, isLoading, error} = useFeatureEnabled('scheduledPublishing')
  const {scheduledPublishing} = useWorkspace()

  const isWorkspaceEnabled = scheduledPublishing.enabled
  const explicitEnabled = scheduledPublishing.__internal__workspaceEnabled

  const hasUsedScheduledPublishing$: Observable<HasUsedScheduledPublishing> = useMemo(() => {
    const {dataset, projectId} = client.config()
    return client.observable
      .request<{schedules: Schedule[]}>({
        uri: `/schedules/${projectId}/${dataset}?limit=1`,
        tag: 'scheduled-publishing-used',
      })
      .pipe(
        map((res) => {
          return {used: res.schedules?.length > 0, loading: false}
        }),
        catchError(() => of({used: false, loading: false})),
      )
  }, [client])

  const hasUsedScheduledPublishing = useObservable(
    hasUsedScheduledPublishing$,
    HAS_USED_SCHEDULED_PUBLISHING,
  )

  const value: ScheduledPublishingEnabledContextValue = useMemo(() => {
    if (!isWorkspaceEnabled || isLoading || error) {
      return {
        enabled: false,
        mode: null,
        hasUsedScheduledPublishing,
      }
    }
    if (explicitEnabled) {
      return {
        enabled: true,
        mode: enabled ? 'default' : 'upsell',
        hasUsedScheduledPublishing,
      }
    }
    if (!hasUsedScheduledPublishing.used) {
      return {
        enabled: false,
        mode: null,
        hasUsedScheduledPublishing,
      }
    }
    return {
      enabled: true,
      mode: enabled ? 'default' : 'upsell',
      hasUsedScheduledPublishing,
    }
  }, [enabled, isLoading, isWorkspaceEnabled, error, hasUsedScheduledPublishing, explicitEnabled])

  return (
    <ScheduledPublishingEnabledContext.Provider value={value}>
      {children}
    </ScheduledPublishingEnabledContext.Provider>
  )
}

/**
 * @internal
 */
export function useScheduledPublishingEnabled(): ScheduledPublishingEnabledContextValue {
  const context = useContext(ScheduledPublishingEnabledContext)
  return context
}
