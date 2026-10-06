import {CalendarIcon} from '@sanity/icons/Calendar'
import {lazy, useEffect, useMemo} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
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
  const featureEnabled = useObservablePromise(featureEnabled$)
  const hasUsedScheduledPublishing = useObservablePromise(hasUsedScheduledPublishing$)
  useEffect(() => {
    void preloadObservablePromise(featureEnabled$)
    void preloadObservablePromise(hasUsedScheduledPublishing$)
  }, [featureEnabled$, hasUsedScheduledPublishing$])

  const enabledPromise = useMemo(
    () =>
      featureEnabled.then(
        ({
          enabled,
          error,
        }):
          | ScheduledPublishingEnabledContextValue
          | Promise<ScheduledPublishingEnabledContextValue> => {
          // A failed feature check disables the feature on its own; don't wait for the usage probe
          if (error) return DISABLED
          return hasUsedScheduledPublishing.then(({used}) =>
            used ? {enabled: true, mode: enabled ? 'default' : 'upsell'} : DISABLED,
          )
        },
      ),
    [featureEnabled, hasUsedScheduledPublishing],
  )

  return (
    <ScheduledPublishingEnabledPromiseContext value={enabledPromise}>
      {props.renderDefault(props)}
    </ScheduledPublishingEnabledPromiseContext>
  )
}
