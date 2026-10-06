import {CalendarIcon} from '@sanity/icons/Calendar'
import {lazy, useEffect, useMemo} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
import {
  ScheduledPublishingEnabledPromiseContext,
  ScheduledPublishingModePromiseContext,
} from 'sanity/_singletons'
import {route} from 'sanity/router'

import {definePlugin} from '../../config/definePlugin'
import {type ProviderProps} from '../../config/studio/types'
import {FEATURES, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'
import {type ScheduledPublishingMode} from '../../scheduledPublishing/contexts/types'
import {useHasUsedScheduledPublishingObservable} from '../../scheduledPublishing/tool/contexts/useHasUsedScheduledPublishing'
import {useWorkspace} from '../../studio/workspace'
import {SCHEDULED_PUBLISHING_TOOL_NAME, TOOL_TITLE} from '../constants'
import {SchedulePublishingUpsellProvider} from '../tool/contexts/SchedulePublishingUpsellProvider'
import resolveDocumentActions from './documentActions/schedule'
import resolveDocumentBadges from './documentBadges/scheduled'

const Tool = lazy(() => import('../tool/Tool'))

const lazyDocumentBannerInput = () => import('./inputResolver')
const DocumentBannerInput = lazy(lazyDocumentBannerInput)

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

/**
 * The scheduled publishing providers for the whole studio: the enabled and mode promises (the
 * navbar's tool menu settles on the first before painting; the plugin's own UI reads the second
 * where it tells upsell from default), and the upsell provider, mounted in both modes so the tree
 * never waits for the feature check or the usage probe (only UI that already knows it is in
 * upsell mode consults it).
 */
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
  useEffect(() => {
    // Preload lazy components (fire-and-forget: the lazy() render reports a failed import)
    void lazyDocumentBannerInput()
  }, [])

  const modePromise = useMemo(
    () =>
      featureEnabled.then(
        ({enabled, error}): ScheduledPublishingMode | Promise<ScheduledPublishingMode> => {
          // A failed feature check disables the feature on its own; don't wait for the usage probe
          if (error) return null
          return hasUsedScheduledPublishing.then(({used}): ScheduledPublishingMode =>
            used ? (enabled ? 'default' : 'upsell') : null,
          )
        },
      ),
    [featureEnabled, hasUsedScheduledPublishing],
  )
  // Enabled exactly when there is a mode: both settle together
  const enabledPromise = useMemo(() => modePromise.then((mode) => mode !== null), [modePromise])

  return (
    <ScheduledPublishingEnabledPromiseContext value={enabledPromise}>
      <ScheduledPublishingModePromiseContext value={modePromise}>
        <SchedulePublishingUpsellProvider>
          {props.renderDefault(props)}
        </SchedulePublishingUpsellProvider>
      </ScheduledPublishingModePromiseContext>
    </ScheduledPublishingEnabledPromiseContext>
  )
}
