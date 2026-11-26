import {describe, expect, test} from 'vitest'

import {selectSlackRoute} from './slackRoute'

describe('selectSlackRoute', () => {
  test.each([
    {hasSuggestionWebhook: true, hasCiAlertsWebhook: true, route: 'webhook-trigger'},
    {hasSuggestionWebhook: true, hasCiAlertsWebhook: false, route: 'webhook-trigger'},
    {hasSuggestionWebhook: false, hasCiAlertsWebhook: true, route: 'incoming-webhook'},
    {hasSuggestionWebhook: false, hasCiAlertsWebhook: false, route: 'none'},
  ] as const)(
    'suggestion=$hasSuggestionWebhook ciAlerts=$hasCiAlertsWebhook routes to $route',
    ({route, ...presence}) => {
      expect(selectSlackRoute(presence)).toBe(route)
    },
  )
})
