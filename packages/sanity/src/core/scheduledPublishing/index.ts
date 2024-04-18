import {CalendarIcon} from '@sanity/icons'
import {route} from 'sanity/router'

import {definePlugin} from '../config'
import {TOOL_NAME, TOOL_TITLE} from './constants'
import resolveDocumentActions from './documentActions'
import resolveDocumentBadges from './documentBadges'
import {DocumentBannerInput} from './inputResolver'
import {SchedulePublishingStudioLayout} from './SchedulePublishingStudioLayout'
import Tool from './tool/Tool'

export {EditScheduleForm} from './components/editScheduleForm/EditScheduleForm'
export {ScheduleAction} from './documentActions/schedule'
export {ScheduledBadge} from './documentBadges/scheduled'
export {resolveDocumentActions, resolveDocumentBadges}
export {type Schedule} from './types'

export const scheduledPublishing = definePlugin({
  // Renamed from 'scheduled-publishing' to 'sanity/scheduled-publishing' to avoid duplicates, see packages/sanity/src/core/config/flattenConfig.ts - DEPRECATED_PLUGINS.
  name: 'sanity/scheduled-publishing',

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
        name: TOOL_NAME,
        title: TOOL_TITLE,
        icon: CalendarIcon,
        component: Tool,
        router: route.create('/', [route.create('/state/:state'), route.create('/date/:date')]),
      },
    ]
  },
})
