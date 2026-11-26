import {type SanityClient} from '@sanity/client'
import {Button, Card, Stack} from '@sanity/ui'
import JSON5 from 'json5'
import {useCallback, useMemo} from 'react'
import {type Schema} from 'sanity'
import {useSchema} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {useTranslation} from 'sanity/i18n'
import {Text, Flex} from 'ui5'

import {useVisionTelemetry} from '../../../__telemetry__/useVisionTelemetry'
import {visionLocaleNamespace} from '../../../i18n'
import {useAiCredits} from '../../hooks/useAiCredits'
import {type QueryAgent} from '../../hooks/useQueryAgent'
import {type VisionTab} from '../../store/types'
import {aiLintFindings} from '../../util/aiQueryChange'
import {fixQueryLint, MAX_GENERATE_ATTEMPTS} from '../../util/generateQuery'
import {type QueryLintFinding} from '../../util/groqLint'
import {type LintFixPlan, planLintFix, shiftFindings} from '../../util/lintFixPlan'
import {summarizeSchema} from '../../util/schemaSummary'
import {AgentActionsTooltip} from '../AgentActionsTooltip'
import {AiCreditsStatus} from '../AiCreditsStatus'
import * as styles from '../redesign.module.css'
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
  /**
   * Writes the quick fixes in place, in the query editor and in the params, and returns the query
   * and params text they leave
   */
  onApplyFixes: (fixes: Pick<LintFixPlan, 'queryEdits' | 'paramFixes'>) => {
    query: string
    rawParams: string
  }
  /** Shows the params, after a fix changed them */
  onParamsFixed: () => void
}

function parseParams(rawParams: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON5.parse(rawParams)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined
  } catch {
    return undefined
  }
}

/**
 * "Fix with AI" in the Lint panel. Each problem is fixed where it is: a problem with a "Did you
 * mean" suggestion gets it written in place, in the query or in the params, without asking the
 * agent. Agent Actions fixes the rest, in the query, in the values of the params when those are
 * what is wrong (the query then stays as it is), or in both. The result replaces what it fixed,
 * and runs; the params show when they changed.
 */
export function LintFix({
  tab,
  params,
  findings,
  client,
  agent,
  onApplyFixes,
  onParamsFixed,
}: LintFixProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const schema = useSchema() as Schema | undefined
  const credits = useAiCredits(client)
  const telemetry = useVisionTelemetry()
  const {status, run, openLastAttempt} = agent

  const plan = useMemo(() => planLintFix(findings), [findings])
  const needsAgent = plan.agent !== undefined

  const fix = useCallback(() => {
    const {queryEdits, paramFixes, agent: forAgent} = plan
    const fixed =
      queryEdits.length > 0 || paramFixes.length > 0
        ? onApplyFixes({queryEdits, paramFixes})
        : {query: tab.query, rawParams: tab.rawParams}
    if (!forAgent) {
      if (paramFixes.length > 0) onParamsFixed()
      telemetry.lintUsed('fix')
      return
    }
    telemetry.agentAction('fix-lint')
    const {target} = forAgent
    const fixedParams = paramFixes.length > 0 ? (parseParams(fixed.rawParams) ?? params) : params
    void run(
      (request) =>
        fixQueryLint({
          ...request,
          query: fixed.query,
          params: fixedParams ?? {},
          diagnostics: shiftFindings(forAgent.findings, queryEdits, fixed.query),
          target,
          schema: schema ? summarizeSchema(schema, fixed.query) : '',
        }),
      {
        comment: false,
        ai: {action: 'fix-lint', findings: aiLintFindings(findings)},
        keepParams: fixedParams === undefined,
        keepQuery: target === 'params',
        // The Lint tab shows the agent's progress and failure, so the params show once it is done
        onOpened: paramFixes.length > 0 || target !== 'query' ? onParamsFixed : undefined,
      },
    )
  }, [
    findings,
    onApplyFixes,
    onParamsFixed,
    params,
    plan,
    run,
    schema,
    tab.query,
    tab.rawParams,
    telemetry,
  ])

  const running = status.type === 'running'
  const shownCredits =
    status.type === 'failed' ? status.limit : status.type === 'idle' ? credits : undefined
  const atLimit = needsAgent && shownCredits?.granted === false

  return (
    <Card borderBottom data-testid="vision-lint-fix-panel">
      <Flex alignItems="center" className={styles.panelBar} gap={2}>
        <AgentActionsTooltip>
          <Button
            data-testid="vision-lint-fix"
            data-fix-mode={needsAgent ? 'agent' : 'suggestions'}
            disabled={running || atLimit}
            fontSize={1}
            gap={2}
            icon={AnimatedSparklesIcon}
            mode="bleed"
            onClick={fix}
            padding={2}
            text={needsAgent ? t('vision.lint.fix') : t('vision.lint.fix.suggestions')}
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
      <Stack gap={2} paddingBottom={2} paddingX={2}>
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
        {needsAgent && (
          <AiCreditsStatus apiHost={client.config().apiHost} credits={shownCredits} size={0} />
        )}
      </Stack>
    </Card>
  )
}
