import {AsteriskIcon} from '@sanity/icons'
import {definePlugin} from 'sanity'
import {route} from 'sanity/router'

import {ErrorReportingTest} from './ErrorReportingTest'

export const errorReportingTestPlugin = definePlugin(() => {
  return {
    name: 'error-reporting-test',
    tools: [
      {
        name: 'error-reporting-test',
        title: 'Errors test',
        icon: AsteriskIcon,
        component: ErrorReportingTest,
        router: route.create('/'),
      },
    ],
  }
})
