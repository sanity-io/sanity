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
import {improveQuery, MAX_GENERATE_ATTEMPTS} from '../../util/generateQuery'
import {summarizeSchema} from '../../util/schemaSummary'
import {AgentActionsTooltip} from '../AgentActionsTooltip'
import {AnimatedSparklesIcon} from '../request/AnimatedSparklesIcon'

export interface ImproveQueryProps {
  tab: VisionTab
  /** The tab's params, which the improvement starts from */
  params: Record<string, unknown> | undefined
  /** The explanation's summary, which History shows with the suggestions */
  summary: string
  /** The explanation's suggestions, the changes the improvement makes */
  suggestions: string[]
  /** The tab's client: attempts are checked with its dataset, API version and perspective */
  client: SanityClient
  /**
   * The request's state lives above this component: the Explain tab's content unmounts when
   * another tab opens or the panel collapses, and a request still running then has to finish and
   * load.
   */
  agent: QueryAgent
}

/**
 * "Improve query" under the explanation's suggestions: has Agent Actions make them to the tab's
 * query, as Edit makes a described change. The improved query replaces the tab's query and
 * params, and runs.
 */
export function ImproveQuery({
  tab,
  params,
  summary,
  suggestions,
  client,
  agent,
}: ImproveQueryProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const schema = useSchema() as Schema | undefined
  const credits = useAiCredits(client)
  const telemetry = useVisionTelemetry()
  const {status, run, openLastAttempt} = agent

  const improve = useCallback(() => {
    telemetry.agentAction('improve-query')
    void run(
      (request) =>
        improveQuery({
          ...request,
          query: tab.query,
          params: params ?? {},
          suggestions,
          schema: schema ? summarizeSchema(schema, `${suggestions.join('\n')}\n${tab.query}`) : '',
        }),
      {
        comment: false,
        keepParams: params === undefined,
        ai: {action: 'improve', summary, suggestions},
      },
    )
  }, [params, run, schema, summary, suggestions, tab.query, telemetry])

  const running = status.type === 'running'
  const shownCredits =
    status.type === 'failed' ? status.limit : status.type === 'idle' ? credits : undefined
  const atLimit = shownCredits?.granted === false

  return (
    <Stack data-testid="vision-improve-query-panel" gap={3}>
      <Flex alignItems="center" flexWrap="wrap" gap={2}>
        <AgentActionsTooltip>
          <Button
            data-testid="vision-improve-query"
            disabled={running || atLimit}
            fontSize={1}
            icon={AnimatedSparklesIcon}
            loading={running}
            onClick={improve}
            padding={2}
            text={t('vision.explain.improve')}
            tone="primary"
          />
        </AgentActionsTooltip>
        {running && (
          <Text data-testid="vision-improve-query-progress" muted size={1} as="div" trim={true}>
            {status.attempt > 1
              ? t('vision.generate.progress-retry', {
                  attempt: status.attempt,
                  max: MAX_GENERATE_ATTEMPTS,
                })
              : t('vision.explain.improve.progress')}
          </Text>
        )}
      </Flex>
      {status.type === 'idle' && !atLimit && (
        <Text muted size={0} as="div" trim={true}>
          {t('vision.explain.improve.description')}
        </Text>
      )}
      {status.type === 'failed' && !atLimit && (
        <Card data-testid="vision-improve-query-error" padding={3} radius={2} tone="critical">
          <Stack gap={3}>
            <Text size={1} weight="medium" as="div" trim={true} tone="critical">
              {t('vision.explain.improve.failed')}
            </Text>
            <Text size={1} as="div" trim={true} tone="critical">
              {status.message}
            </Text>
            {status.lastAttempt && (
              <Flex>
                <Button
                  data-testid="vision-improve-query-open-anyway"
                  fontSize={1}
                  mode="ghost"
                  onClick={openLastAttempt}
                  padding={2}
                  text={t('vision.generate.open-anyway')}
                />
              </Flex>
            )}
          </Stack>
        </Card>
      )}
    </Stack>
  )
}
