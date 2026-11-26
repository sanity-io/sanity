import {selectSlackRoute} from '../slackRoute'
import {type CliDeps} from './deps'
import {appendGithubOutput, matchesOneOf} from './outputs'

export async function runSlackRoute(deps: CliDeps): Promise<number> {
  const route = selectSlackRoute({
    hasSuggestionWebhook: deps.env.HAS_SUGGESTION_WEBHOOK === 'true',
    hasCiAlertsWebhook: deps.env.HAS_CI_ALERTS_WEBHOOK === 'true',
  })
  await appendGithubOutput(deps, [
    {
      name: 'route',
      value: route,
      isValid: matchesOneOf(['webhook-trigger', 'incoming-webhook', 'none']),
    },
  ])
  deps.stdout(`Slack route: ${route}`)
  return 0
}
