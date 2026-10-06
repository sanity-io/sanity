import {CalendarIcon} from '@sanity/icons/Calendar'
import {lazy, useEffect, useMemo} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
import {map, of, switchMap} from 'rxjs'
import {
  type ScheduledPublishingEnabledContextValue,
  ScheduledPublishingEnabledPromiseContext,
} from 'sanity/_singletons'
import {route} from 'sanity/router'

import {definePlugin} from '../../config/definePlugin'
import {type ProviderProps} from '../../config/studio/types'
import {FEATURES, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'
import {useHasUsedScheduledPublishingObservable} from '../../scheduledPublishing/tool/contexts/useHasUsedScheduledPublishing'
import {useWorkspace} from '../../studio/workspace'
import {SCHEDULED_PUBLISHING_TOOL_NAME, TOOL_TITLE} from '../constants'
import resolveDocumentActions from './documentActions/schedule'
import resolveDocumentBadges from './documentBadges/scheduled'
import {SchedulePublishingStudioLayout} from './SchedulePublishingStudioLayout'

const Tool = lazy(() => import('../tool/Tool'))
const DocumentBannerInput = lazy(() => import('./inputResolver'))

/**
 * @internal
 */
export const SCHEDULED_PUBLISHING_NAME = 'sanity/scheduled-publishing'

/**
 * @internal
 */
export const scheduledPublishing = definePlugin({
  // Renamed from 'scheduled-publishing' to 'sanity/scheduled-publishing' to avoid duplicates, see packages/sanity/src/core/config/flattenConfig.ts - DEPRECATED_PLUGINS.
  name: SCHEDULED_PUBLISHING_NAME,

  document: {
    actions: (prev, context) => resolveDocumentActions(prev, context),
    badges: (prev) => resolveDocumentBadges(prev),
  },

  form: {
    components: {
      input: DocumentBannerInput,
    },
  },
  studio: {
    components: {
      provider: SchedulePublishingStudioProvider,
      layout: SchedulePublishingStudioLayout,
    },
  },

  tools: (prev) => {
    return [
      ...prev,
      {
        name: SCHEDULED_PUBLISHING_TOOL_NAME,
        title: TOOL_TITLE,
        icon: CalendarIcon,
        component: Tool,
        router: route.create('/', [route.create('/state/:state'), route.create('/date/:date')]),
        __internalApplicationType: 'sanity/scheduled-publishing',
      },
    ]
  },
})

const DISABLED: ScheduledPublishingEnabledContextValue = {enabled: false, mode: null}

function SchedulePublishingStudioProvider(props: ProviderProps) {
  const featureEnabled$ = useFeatureEnabledObservable(FEATURES.scheduledPublishing)
  const hasUsedScheduledPublishing$ = useHasUsedScheduledPublishingObservable({
    explicitEnabled: useWorkspace().scheduledPublishing.__internal__workspaceEnabled,
  })
  // Chained in the observable, not with `promise.then`: a derived promise is a plain promise that
  // stays pending for a microtask, so `use()` could not read an already settled check without
  // suspending first.
  const enabled$ = useMemo(
    () =>
      featureEnabled$.pipe(
        switchMap(({enabled, error}) => {
          // A failed feature check disables the feature on its own; don't wait for the usage probe
          if (error) return of(DISABLED)
          return hasUsedScheduledPublishing$.pipe(
            map(({used}): ScheduledPublishingEnabledContextValue =>
              used ? {enabled: true, mode: enabled ? 'default' : 'upsell'} : DISABLED,
            ),
          )
        }),
      ),
    [featureEnabled$, hasUsedScheduledPublishing$],
  )
  const enabledPromise = useObservablePromise(enabled$)
  useEffect(() => {
    // Preloaded individually so both requests are in flight at once; `enabled$` only chains them
    void preloadObservablePromise(featureEnabled$)
    void preloadObservablePromise(hasUsedScheduledPublishing$)
  }, [featureEnabled$, hasUsedScheduledPublishing$])

  return (
    <ScheduledPublishingEnabledPromiseContext value={enabledPromise}>
      {props.renderDefault(props)}
    </ScheduledPublishingEnabledPromiseContext>
  )
}
