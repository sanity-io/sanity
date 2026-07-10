import {AsteriskIcon} from '@sanity/icons/Asterisk'
import {definePlugin} from 'sanity'
import {route} from 'sanity/router'

import {ErrorReportingTest} from './ErrorReportingTest'

export const errorReportingTestPlugin = definePlugin(() => {
  return {
    name: 'error-reporting-test',
    tools: [
      {
        name: 'error-reporting-test',
        title: 'Error playground',
        icon: AsteriskIcon,
        component: ErrorReportingTest,
        router: route.create('/', [route.create('/:tab')]),
      },
    ],
  }
})
