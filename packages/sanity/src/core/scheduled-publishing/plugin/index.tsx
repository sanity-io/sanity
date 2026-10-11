import {CalendarIcon} from '@sanity/icons/Calendar'
import {lazy, type ReactNode, useEffect} from 'react'
import {route} from 'sanity/router'

import {definePlugin} from '../../config/definePlugin'
import {type ProviderProps} from '../../config/studio/types'
import {
  ScheduledPublishingEnabledProvider,
  useScheduledPublishingEnabled,
} from '../../scheduledPublishing/contexts/ScheduledPublishingEnabledProvider'
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

/** The scheduled publishing providers for the whole studio */
function SchedulePublishingStudioProvider(props: ProviderProps) {
  useEffect(() => {
    // Preload lazy components (fire-and-forget: the lazy() render reports a failed import)
    void lazyDocumentBannerInput()
  }, [])

  return (
    <ScheduledPublishingEnabledProvider>
      <SchedulePublishingUpsellProviderInUpsellMode>
        {props.renderDefault(props)}
      </SchedulePublishingUpsellProviderInUpsellMode>
    </ScheduledPublishingEnabledProvider>
  )
}

function SchedulePublishingUpsellProviderInUpsellMode({children}: {children: ReactNode}) {
  const {enabled, mode} = useScheduledPublishingEnabled()
  if (!enabled || mode !== 'upsell') {
    return children
  }
  return <SchedulePublishingUpsellProvider>{children}</SchedulePublishingUpsellProvider>
}
