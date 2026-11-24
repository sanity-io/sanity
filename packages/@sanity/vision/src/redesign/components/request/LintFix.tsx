import {type SanityClient} from '@sanity/client'
import {Button, Card, Stack} from '@sanity/ui'
import {useCallback} from 'react'
import {type Schema, useSchema} from 'sanity'
import {useTranslation} from 'sanity/i18n'
import {Text, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {useVisionTelemetry} from '../../../telemetry/useVisionTelemetry'
import {useAiCredits} from '../../hooks/useAiCredits'
import {type QueryAgent} from '../../hooks/useQueryAgent'
import {type VisionTab} from '../../store/types'
import {fixQueryLint, MAX_GENERATE_ATTEMPTS} from '../../util/generateQuery'
import {type QueryLintFinding} from '../../util/groqLint'
import {summarizeSchema} from '../../util/schemaSummary'
import {AgentActionsTooltip} from '../AgentActionsTooltip'
import {AiCreditsStatus} from '../AiCreditsStatus'
import {AnimatedSparklesIcon} from './AnimatedSparklesIcon'

export interface LintFixProps {
  tab: VisionTab
  /** The tab's params, which the fix starts from */
  params: Record<string, unknown> | undefined
  /** The query editor's lint diagnostics for the tab's query */
  findings: QueryLintFinding[]
  /** The tab's client: attempts are checked with its dataset, API version and perspective */
  client: SanityClient
  /**
   * The request's state lives above this component: the Lint tab's content unmounts when another
   * tab opens or the panel collapses, and a request still running then has to finish and load.
   */
  agent: QueryAgent
}

/**
 * "Fix with AI" in the Lint panel: has Agent Actions fix the problems the linter found in the
 * tab's query. The fixed query replaces the tab's query and params, and runs.
 */
export function LintFix({tab, params, findings, client, agent}: LintFixProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const schema = useSchema() as Schema | undefined
  const credits = useAiCredits(client)
  const telemetry = useVisionTelemetry()
  const {status, run, openLastAttempt} = agent

  const fix = useCallback(() => {
    telemetry.agentAction('fix-lint')
    void run(
      (agent) =>
        fixQueryLint({
          ...agent,
          query: tab.query,
          params: params ?? {},
          diagnostics: findings,
          schema: schema ? summarizeSchema(schema, tab.query) : '',
        }),
      {comment: false, keepParams: params === undefined},
    )
  }, [findings, params, run, schema, tab.query, telemetry])

  const running = status.type === 'running'
  const shownCredits =
    status.type === 'failed' ? status.limit : status.type === 'idle' ? credits : undefined
  const atLimit = shownCredits?.granted === false

  return (
    <Card borderBottom data-testid="vision-lint-fix-panel">
      <Stack gap={2} padding={2}>
        <Flex alignItems="center" gap={2}>
          <AgentActionsTooltip>
            <Button
              data-testid="vision-lint-fix"
              disabled={running || atLimit}
              fontSize={1}
              gap={2}
              icon={AnimatedSparklesIcon}
              mode="bleed"
              onClick={fix}
              padding={2}
              text={t('vision.lint.fix')}
              tone="primary"
            />
          </AgentActionsTooltip>
          {running && (
            <Text data-testid="vision-lint-fix-progress" muted size={1} as="div" trim={true}>
              {status.attempt > 1
                ? t('vision.generate.progress-retry', {
                    attempt: status.attempt,
                    max: MAX_GENERATE_ATTEMPTS,
                  })
                : t('vision.lint.fix.progress')}
            </Text>
          )}
        </Flex>
        {status.type === 'failed' && !atLimit && (
          <Card data-testid="vision-lint-fix-error" padding={3} radius={2} tone="critical">
            <Stack gap={3}>
              <Text size={1} weight="medium" as="div" trim={true} tone="critical">
                {t('vision.lint.fix.failed')}
              </Text>
              <Text size={1} as="div" trim={true} tone="critical">
                {status.message}
              </Text>
              {status.lastAttempt && (
                <Flex>
                  <Button
                    data-testid="vision-lint-fix-open-anyway"
                    fontSize={1}
                    mode="ghost"
                    onClick={openLastAttempt}
                    padding={2}
                    text={t('vision.lint.fix.open-anyway')}
                  />
                </Flex>
              )}
            </Stack>
          </Card>
        )}
        <AiCreditsStatus apiHost={client.config().apiHost} credits={shownCredits} size={0} />
      </Stack>
    </Card>
  )
}
