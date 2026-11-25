import {type SanityClient} from '@sanity/client'
import {BoltIcon} from '@sanity/icons/Bolt'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Button, Card, type CardTone, Label, Stack} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {type ComponentType, useId, useMemo, useState} from 'react'
import {type TFunction} from 'sanity'
import {InlineCode, useTranslation} from 'sanity/i18n'
import {Text, Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {useAiFeatures} from '../../aiFeatures'
import {useAiCredits} from '../../hooks/useAiCredits'
import {type QueryAgent} from '../../hooks/useQueryAgent'
import {type ExplainStep} from '../../hooks/useQueryExplain'
import {type VisionTab} from '../../store/types'
import {type AiCredits} from '../../util/aiCredits'
import {cx} from '../../util/cx'
import {type QueryExplanation, type QueryVerdict} from '../../util/explainQuery'
import {splitMessage} from '../../util/groqLint'
import {
  HIGH_PERFORMANCE_GROQ_URL,
  type PlanInsight,
  presentPlanInsights,
  readPlanInsights,
} from '../../util/planInsights'
import {AgentActionsTooltip} from '../AgentActionsTooltip'
import {AiCreditsStatus} from '../AiCreditsStatus'
import {AnimatedSparklesIcon} from '../request/AnimatedSparklesIcon'
import {ImproveQuery, type ImproveQueryProps} from './ImproveQuery'
import * as motion from './responseTabs.module.css'

const VERDICTS = {
  'performant': {
    tone: 'positive',
    icon: CheckmarkCircleIcon,
    title: 'vision.explain.verdict.performant',
  },
  'cannot-improve': {
    tone: 'neutral',
    icon: InfoOutlineIcon,
    title: 'vision.explain.verdict.cannot-improve',
  },
  'improvable': {
    tone: 'caution',
    icon: BoltIcon,
    title: 'vision.explain.verdict.improvable',
  },
} as const satisfies Record<
  QueryVerdict,
  {tone: CardTone; icon: ComponentType; title: `vision.explain.verdict.${QueryVerdict}`}
>

/** Text with the GROQ it quotes in backticks shown as code */
function RichText({text}: {text: string}) {
  return splitMessage(text).map((segment, index) =>
    segment.code ? <InlineCode key={index}>{segment.text}</InlineCode> : segment.text,
  )
}

function Paragraphs({text, muted}: {text: string; muted?: boolean}) {
  return text
    .split(/\n+/)
    .filter((paragraph) => paragraph.trim())
    .map((paragraph, index) => (
      <Text key={index} muted={muted} size={1} as="div" trim={true}>
        <RichText text={paragraph.trim()} />
      </Text>
    ))
}

interface ExplanationProps {
  explanation: QueryExplanation
  /** Makes the suggestions to the query; undefined while editing queries with AI is off */
  improve: Omit<ImproveQueryProps, 'suggestions'> | undefined
}

/**
 * The explanation, for someone new to Sanity: what the query does in plain words, whether it
 * runs well, what would make it faster, and only then how the plan runs it
 */
function Explanation({explanation, improve}: ExplanationProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const detailsId = useId()
  const {summary, verdict, verdictReason, suggestions, details} = explanation
  const verdictCopy = VERDICTS[verdict]
  const VerdictIcon = verdictCopy.icon

  return (
    <Card
      border
      className={motion.reveal}
      data-testid="vision-explanation"
      padding={3}
      radius={2}
      tone="transparent"
    >
      <Stack gap={4}>
        <Stack data-testid="vision-explanation-summary" gap={3}>
          <Paragraphs text={summary} />
        </Stack>
        <Card
          data-testid="vision-explain-verdict"
          data-verdict={verdict}
          padding={3}
          radius={2}
          tone={verdictCopy.tone}
        >
          <Flex gap={3}>
            <Text size={1} as="div">
              <VerdictIcon />
            </Text>
            <Stack gap={2} flex={1}>
              <Text size={1} weight="semibold" as="div" trim={true}>
                {t(verdictCopy.title)}
              </Text>
              {verdictReason && (
                <Text size={1} as="div" trim={true}>
                  <RichText text={verdictReason} />
                </Text>
              )}
            </Stack>
          </Flex>
        </Card>
        {suggestions.length > 0 && (
          <Stack data-testid="vision-explain-suggestions" gap={3}>
            <Text size={1} weight="semibold" as="div" trim={true}>
              {t('vision.explain.suggestions.title')}
            </Text>
            <Stack as="ol" gap={3} style={{margin: 0, padding: 0, listStyle: 'none'}}>
              {suggestions.map((suggestion, index) => (
                <Flex as="li" data-testid="vision-explain-suggestion" gap={2} key={index}>
                  <Text muted size={1} as="span" trim={true}>
                    {index + 1}.
                  </Text>
                  <Text size={1} as="div" trim={true}>
                    <RichText text={suggestion} />
                  </Text>
                </Flex>
              ))}
            </Stack>
            {improve && <ImproveQuery {...improve} suggestions={suggestions} />}
          </Stack>
        )}
        {details && (
          <Stack gap={3}>
            <Flex>
              <Button
                aria-controls={detailsId}
                aria-expanded={detailsOpen}
                data-testid="vision-explanation-details-toggle"
                fontSize={1}
                icon={
                  <span className={motion.chevron}>
                    <ChevronRightIcon />
                  </span>
                }
                mode="bleed"
                onClick={() => setDetailsOpen((open) => !open)}
                padding={1}
                text={t('vision.explain.details')}
              />
            </Flex>
            {detailsOpen && (
              <Stack
                className={motion.reveal}
                data-testid="vision-explanation-details"
                gap={3}
                id={detailsId}
              >
                <Paragraphs muted text={details} />
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}

/** What a plan insight means, as the Explain panel and the WebMCP explain tool say it */
export function describeInsight(insight: PlanInsight, t: TFunction<'vision'>): string {
  switch (insight.kind) {
    case 'filter-in-memory':
      return t('vision.explain.insight.filter-in-memory')
    case 'sort-in-memory':
      return t('vision.explain.insight.sort-in-memory')
    case 'slice-in-memory':
      return t('vision.explain.insight.slice-in-memory')
    case 'index-sort-limit':
      return t('vision.explain.insight.index-sort-limit')
    case 'batched-subquery':
      return t('vision.explain.insight.batched-subquery')
    case 'aggregate':
      return t('vision.explain.insight.aggregate')
    default: {
      const unhandled: never = insight
      return String(unhandled)
    }
  }
}

export interface ExplainTabProps {
  tab: VisionTab
  /** The tab's params, which Improve query starts from; undefined while they do not parse */
  params: Record<string, unknown> | undefined
  /**
   * The tab's client, whose project the AI credits are read through, and which checks the
   * attempts of Improve query
   */
  client: SanityClient
  plan: ExplainStep
  explanation: ExplainStep<QueryExplanation>
  /** Improve query's request, kept above the tab so it outlives the panel's content */
  improveAgent: QueryAgent
  /** There is a valid request to explain */
  canExplain: boolean
  onShowPlan: () => void
  onExplain: () => void
}

/** The AI credits under the explain button, read when it mounts */
function ExplainCredits({client, limit}: {client: SanityClient; limit: AiCredits | undefined}) {
  const credits = useAiCredits(client)
  return <AiCreditsStatus apiHost={client.config().apiHost} credits={limit ?? credits} />
}

/**
 * How the Content Lake runs the tab's query: its query plan (the query endpoint's `explain`),
 * and on request an explanation of the query and the plan written by Agent Actions, unless the
 * `explainQuery` AI feature is off
 */
export function ExplainTab(props: ExplainTabProps) {
  const {tab, params, client, plan, explanation, improveAgent, canExplain, onShowPlan, onExplain} =
    props
  const {t} = useTranslation(visionLocaleNamespace)
  const {explainQuery: aiExplain, editQuery: aiEdit} = useAiFeatures()
  const explaining = explanation.status === 'loading'
  const planText = plan.status === 'done' ? plan.result : undefined
  const verdict = explanation.status === 'done' ? explanation.result.verdict : undefined
  const insights = useMemo(() => (planText ? readPlanInsights(planText) : []), [planText])
  // A verdict must not sit beside a card that calls the same query slow
  const presented = useMemo(() => presentPlanInsights(insights, verdict), [insights, verdict])
  // The credits as the failed request reported them, or as last read
  const limit =
    explanation.status === 'failed'
      ? explanation.limit
      : improveAgent.status.type === 'failed'
        ? improveAgent.status.limit
        : undefined

  return (
    <Box data-testid="vision-explain" padding={3}>
      <Stack gap={4}>
        <Text muted size={1} as="div" trim={true}>
          {aiExplain ? t('vision.explain.description') : t('vision.explain.description-plan')}
        </Text>
        <Flex flexWrap="wrap" gap={2}>
          {aiExplain && (
            <AgentActionsTooltip>
              <Button
                data-testid="vision-explain-button"
                disabled={!canExplain || explaining}
                fontSize={1}
                icon={AnimatedSparklesIcon}
                loading={explaining}
                onClick={onExplain}
                padding={2}
                text={t('vision.explain.explain')}
                tone="primary"
              />
            </AgentActionsTooltip>
          )}
          <Button
            data-testid="vision-explain-plan-button"
            disabled={!canExplain || plan.status === 'loading'}
            fontSize={1}
            loading={plan.status === 'loading' && !explaining}
            mode="ghost"
            onClick={onShowPlan}
            padding={2}
            text={t('vision.explain.plan')}
          />
        </Flex>
        {aiExplain && <ExplainCredits client={client} limit={limit} />}
        {!canExplain && (
          <Text muted size={1} as="div" trim={true}>
            {t('vision.explain.empty')}
          </Text>
        )}
        {explanation.status === 'done' && (
          <Explanation
            explanation={explanation.result}
            improve={aiEdit ? {tab, params, client, agent: improveAgent} : undefined}
            key={explanation.url}
          />
        )}
        {explanation.status === 'failed' && !limit && (
          <Text data-testid="vision-explain-error" size={1} as="div" trim={true}>
            {t('vision.explain.failed', {message: explanation.message})}
          </Text>
        )}
        {plan.status === 'failed' && (
          <Text data-testid="vision-explain-error" size={1} as="div" trim={true}>
            {t('vision.explain.plan-failed', {message: plan.message})}
          </Text>
        )}
        {plan.status === 'done' && presented.insights.length > 0 && (
          <Stack className={motion.reveal} data-testid="vision-plan-insights" gap={2}>
            <Label muted size={0}>
              {t('vision.explain.insights.title')}
            </Label>
            {presented.insights.map((insight, index) => (
              <Card
                border
                data-testid="vision-plan-insight"
                key={`${insight.kind}:${index}`}
                padding={3}
                radius={2}
                tone={insight.tone}
              >
                <Stack gap={3}>
                  <Text size={1} as="div" trim={true} tone={insight.tone}>
                    {t(insight.message)}
                  </Text>
                  {insight.expression && <Code size={1}>{insight.expression}</Code>}
                </Stack>
              </Card>
            ))}
            {presented.showGuide && (
              <Text muted size={1} as="div" trim={true}>
                <a href={HIGH_PERFORMANCE_GROQ_URL} rel="noreferrer" target="_blank">
                  {t('vision.explain.insights.guide')}
                </a>
              </Text>
            )}
          </Stack>
        )}
        {plan.status === 'done' && (
          <Stack
            className={cx(motion.reveal, presented.insights.length > 0 && motion.revealSecond)}
            data-testid="vision-query-plan"
            gap={2}
          >
            <Label muted size={0}>
              {t('vision.explain.plan-title')}
            </Label>
            <Code size={1}>{plan.result}</Code>
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
