import {CalendarIcon} from '@sanity/icons/Calendar'
import {definePlugin} from 'sanity'

import {TimelineSandbox} from './TimelineSandbox'

/**
 * Dev-only sandbox for iterating on the releases forward-timeline design with mock data (no Content
 * Lake dependency, so it renders anywhere). Not shipped.
 */
export const timelineSandboxTool = definePlugin(() => ({
  name: 'timeline-sandbox',
  tools: [
    {
      name: 'timeline-sandbox',
      title: 'Timeline sandbox',
      icon: CalendarIcon,
      component: TimelineSandbox,
    },
  ],
}))
