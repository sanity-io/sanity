import {Tool} from 'sanity'
import {Main} from './Main'
import {route} from 'sanity/router'

export default {
  name: 'approval-tool',
  component: Main,
  title: 'Approval tool',

  router: route.create('/:foo'),

  canHandleIntent(intent: string, params: Record<string, unknown>, payload: unknown) {
    return intent === 'approve'
  },
  getIntentState(intent: string, params: Record<string, unknown>) {
    return {foo: 'bar'}
  },
} satisfies Tool
