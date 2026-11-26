import {type SlackRoute} from './types'

export function selectSlackRoute(options: {
  hasSuggestionWebhook: boolean
  hasCiAlertsWebhook: boolean
}): SlackRoute {
  if (options.hasSuggestionWebhook) return 'webhook-trigger'
  if (options.hasCiAlertsWebhook) return 'incoming-webhook'
  return 'none'
}
