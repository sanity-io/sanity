import {CalendarIcon} from '@sanity/icons'
import {route} from 'sanity/router'

import {definePlugin} from '../../config'
import {SCHEDULED_PUBLISHING_TOOL_NAME, TOOL_TITLE} from '../constants'
import Tool from '../tool/Tool'
import resolveDocumentActions from './documentActions/schedule'
import resolveDocumentBadges from './documentBadges/scheduled'
import {DocumentBannerInput} from './inputResolver'
import {SchedulePublishingStudioLayout} from './SchedulePublishingStudioLayout'

export {EditScheduleForm} from '../components/editScheduleForm/EditScheduleForm'
export {resolveDocumentActions, resolveDocumentBadges}
export {type Schedule} from '../types'

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
    actions: (prev) => resolveDocumentActions(prev),
    badges: (prev) => resolveDocumentBadges(prev),
  },

  form: {
    components: {
      input: DocumentBannerInput,
    },
  },
  studio: {
    components: {
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
