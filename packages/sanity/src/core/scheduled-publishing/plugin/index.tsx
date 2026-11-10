import {CalendarIcon} from '@sanity/icons/Calendar'
import {lazy, useEffect, useMemo} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
import {map} from 'rxjs'
import {
  HasUsedScheduledPublishingPromiseContext,
  ScheduledPublishingEnabledContext,
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
 * The scheduled publishing contexts for the whole studio: whether the workspace has the feature
 * enabled, and the two answers that arrive later, as promises for `use()`: the mode (from the
 * feature check) and whether the dataset has ever scheduled anything (from the usage probe). Each
 * callsite combines them for its own purpose: the navbar's tool menu, which also renders where the
 * plugin is not loaded, lists the tool when `enabled && mode !== null && hasUsed`; the tool, the
 * document action and the schedule polling only render through the plugin, so they skip the
 * always-true flag and count the feature as on when `mode !== null && hasUsed`. The upsell
 * provider is mounted in both modes so the tree never waits for the feature check; its dialog
 * reads the mode at the leaf.
 */
function SchedulePublishingStudioProvider(props: ProviderProps) {
  const {scheduledPublishing} = useWorkspace()
  const features$ = useFeatureEnabledObservable(FEATURES.scheduledPublishing)
  // Derived inside the observable, so the context carries the promise that settles in place and
  // `use()` reads it synchronously once it has (a `.then()`-derived promise suspends once more)
  const mode$ = useMemo(
    () =>
      features$.pipe(
        map(({enabled, error}): ScheduledPublishingMode => {
          if (error) return null
          return enabled ? 'default' : 'upsell'
        }),
      ),
    [features$],
  )
  const hasUsed$ = useHasUsedScheduledPublishingObservable({
    explicitEnabled: scheduledPublishing.__internal__workspaceEnabled,
  })
  const modePromise = useObservablePromise(mode$)
  const hasUsedPromise = useObservablePromise(hasUsed$)
  useEffect(() => {
    void preloadObservablePromise(mode$)
    void preloadObservablePromise(hasUsed$)
  }, [hasUsed$, mode$])
  useEffect(() => {
    // Preload lazy components (fire-and-forget: the lazy() render reports a failed import)
    void lazyDocumentBannerInput()
  }, [])

  return (
    <ScheduledPublishingEnabledContext value={scheduledPublishing.enabled}>
      <ScheduledPublishingModePromiseContext value={modePromise}>
        <HasUsedScheduledPublishingPromiseContext value={hasUsedPromise}>
          <SchedulePublishingUpsellProvider>
            {props.renderDefault(props)}
          </SchedulePublishingUpsellProvider>
        </HasUsedScheduledPublishingPromiseContext>
      </ScheduledPublishingModePromiseContext>
    </ScheduledPublishingEnabledContext>
  )
}
