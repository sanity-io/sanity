import {SparklesIcon} from '@sanity/icons/Sparkles'
import {Button, Card, Label, Stack, Text} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {useMemo} from 'react'
import {type TFunction, useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type ExplainStep} from '../../hooks/useQueryExplain'
import {splitMessage} from '../../util/groqLint'
import {
  HIGH_PERFORMANCE_GROQ_URL,
  type PlanInsight,
  readPlanInsights,
} from '../../util/planInsights'

/** What a plan insight means, as the Explain panel and the WebMCP explain tool say it */
export function describeInsight(insight: PlanInsight, t: TFunction<'vision'>): string {
  switch (insight.kind) {
    case 'filter-in-memory':
      return t('vista.explain.insight.filter-in-memory')
    case 'sort-in-memory':
      return t('vista.explain.insight.sort-in-memory')
    case 'slice-in-memory':
      return t('vista.explain.insight.slice-in-memory')
    case 'index-sort-limit':
      return t('vista.explain.insight.index-sort-limit')
    case 'batched-subquery':
      return t('vista.explain.insight.batched-subquery')
    case 'aggregate':
      return t('vista.explain.insight.aggregate')
    default: {
      const unhandled: never = insight
      return String(unhandled)
    }
  }
}

export interface ExplainTabProps {
  plan: ExplainStep
  explanation: ExplainStep
  /** There is a valid request to explain */
  canExplain: boolean
  onShowPlan: () => void
  onExplain: () => void
}

/**
 * How the Content Lake runs the tab's query: its query plan (the query endpoint's `explain`),
 * and on request an explanation of the query and the plan written by Agent Actions
 */
export function ExplainTab(props: ExplainTabProps) {
  const {plan, explanation, canExplain, onShowPlan, onExplain} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const explaining = explanation.status === 'loading'
  const planText = plan.status === 'done' ? plan.text : undefined
  const insights = useMemo(() => (planText ? readPlanInsights(planText) : []), [planText])

  return (
    <Box data-testid="vista-explain" padding={3}>
      <Stack gap={4}>
        <Text muted size={1}>
          {t('vista.explain.description')}
        </Text>
        <Flex flexWrap="wrap" gap={2}>
          <Button
            data-testid="vista-explain-button"
            disabled={!canExplain || explaining}
            fontSize={1}
            icon={SparklesIcon}
            loading={explaining}
            onClick={onExplain}
            padding={2}
            text={t('vista.explain.explain')}
            tone="primary"
          />
          <Button
            data-testid="vista-explain-plan-button"
            disabled={!canExplain || plan.status === 'loading'}
            fontSize={1}
            loading={plan.status === 'loading' && !explaining}
            mode="ghost"
            onClick={onShowPlan}
            padding={2}
            text={t('vista.explain.plan')}
          />
        </Flex>
        {!canExplain && (
          <Text muted size={1}>
            {t('vista.explain.empty')}
          </Text>
        )}
        {explanation.status === 'done' && (
          <Card data-testid="vista-explanation" padding={3} radius={2} tone="transparent" border>
            <Stack gap={4}>
              {explanation.text
                .split(/\n+/)
                .filter((paragraph) => paragraph.trim())
                .map((paragraph, index) => (
                  <Text key={index} size={1}>
                    {splitMessage(paragraph.trim()).map((segment, segmentIndex) =>
                      segment.code ? <code key={segmentIndex}>{segment.text}</code> : segment.text,
                    )}
                  </Text>
                ))}
            </Stack>
          </Card>
        )}
        {explanation.status === 'failed' && (
          <Text data-testid="vista-explain-error" size={1}>
            {t('vista.explain.failed', {message: explanation.message})}
          </Text>
        )}
        {plan.status === 'failed' && (
          <Text data-testid="vista-explain-error" size={1}>
            {t('vista.explain.plan-failed', {message: plan.message})}
          </Text>
        )}
        {plan.status === 'done' && insights.length > 0 && (
          <Stack data-testid="vista-plan-insights" gap={2}>
            <Label muted size={0}>
              {t('vista.explain.insights.title')}
            </Label>
            {insights.map((insight, index) => (
              <Card
                border
                data-testid="vista-plan-insight"
                key={`${insight.kind}:${index}`}
                padding={3}
                radius={2}
                tone={insight.tone}
              >
                <Stack gap={3}>
                  <Text size={1}>{describeInsight(insight, t)}</Text>
                  {insight.kind === 'filter-in-memory' && (
                    <Code size={1}>{insight.expression}</Code>
                  )}
                </Stack>
              </Card>
            ))}
            {insights.some((insight) => insight.tone === 'caution') && (
              <Text muted size={1}>
                <a href={HIGH_PERFORMANCE_GROQ_URL} rel="noreferrer" target="_blank">
                  {t('vista.explain.insights.guide')}
                </a>
              </Text>
            )}
          </Stack>
        )}
        {plan.status === 'done' && (
          <Stack data-testid="vista-query-plan" gap={2}>
            <Label muted size={0}>
              {t('vista.explain.plan-title')}
            </Label>
            <Code size={1}>{plan.text}</Code>
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
