import {CalendarIcon} from '@sanity/icons'
import {route} from 'sanity/router'

import {definePlugin} from '../config'
import {DEFAULT_PLUGIN_OPTIONS, TOOL_NAME, TOOL_TITLE} from './constants'
import resolveDocumentActions from './documentActions'
import resolveDocumentBadges from './documentBadges'
import {DocumentBannerInput} from './inputResolver'
import Tool from './tool/Tool'
import {type PluginOptions} from './types'

export {EditScheduleForm} from './components/editScheduleForm/EditScheduleForm'
export {ScheduleAction} from './documentActions/schedule'
export {ScheduledBadge} from './documentBadges/scheduled'
export {resolveDocumentActions, resolveDocumentBadges}
export {type Schedule} from './types'

export const scheduledPublishing = definePlugin<PluginOptions | void>((options) => {
  const pluginOptions = {...DEFAULT_PLUGIN_OPTIONS, ...options}
  //TODO: Find a way to add plugin options.
  // scheduledPublishing({
  //   // E.g. 12/25/2000 6:30 AM
  //   inputDateTimeFormat: 'MM/dd/yyyy h:mm a',
  // })
  return {
    name: 'scheduled-publishing',

    document: {
      actions: (prev) => resolveDocumentActions(prev),
      badges: (prev) => resolveDocumentBadges(prev),
    },

    form: {
      components: {
        input: DocumentBannerInput,
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
          options: pluginOptions,
        },
      ]
    },
  }
})
