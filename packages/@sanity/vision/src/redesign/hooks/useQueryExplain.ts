import {useCallback, useState} from 'react'

import {useVisionTelemetry} from '../../__telemetry__/useVisionTelemetry'
import {useAiFeatures} from '../aiFeatures'
import {useAiCreditsUpsell} from '../components/AiCreditsUpsellContext'
import {type QueryRequest} from '../store/types'
import {type AiCredits, readAiCreditsLimit} from '../util/aiCredits'
import {explainQuery, fetchQueryPlan, type QueryExplanation} from '../util/explainQuery'
import {reportAiCreditsGranted, reportAiCreditsLimit} from './useAiCredits'

/** A step of the Explain panel; `Result` is what it comes back with: the plan's text by default */
export type ExplainStep<Result = string> =
  | {status: 'idle'}
  | {status: 'loading'; url: string}
  | {status: 'done'; url: string; result: Result}
  | {
      status: 'failed'
      url: string
      message: string
      /** The AI credits the request was turned down for, when that is what failed */
      limit: AiCredits | undefined
    }

const IDLE = {status: 'idle'} as const

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * The Explain panel's query plan and plain-language explanation of the tab's current request.
 * Each belongs to the request it was made for: once the query, params or options change, the
 * panel starts over rather than describing a query that is no longer there.
 */
export function useQueryExplain(request: QueryRequest | null) {
  const [plan, setPlan] = useState<ExplainStep>(IDLE)
  const [explanation, setExplanation] = useState<ExplainStep<QueryExplanation>>(IDLE)
  const upsell = useAiCreditsUpsell()
  const {explainQuery: canExplain} = useAiFeatures()
  const url = request?.url
  const currentPlan: ExplainStep = plan.status !== 'idle' && plan.url === url ? plan : IDLE
  const currentExplanation: ExplainStep<QueryExplanation> =
    canExplain && explanation.status !== 'idle' && explanation.url === url ? explanation : IDLE

  const loadPlan = useCallback(async (current: QueryRequest): Promise<string | undefined> => {
    setPlan({status: 'loading', url: current.url})
    try {
      const result = await fetchQueryPlan(current.client, current)
      setPlan({status: 'done', url: current.url, result})
      return result
    } catch (error) {
      setPlan({status: 'failed', url: current.url, message: toMessage(error), limit: undefined})
      return undefined
    }
  }, [])

  const telemetry = useVisionTelemetry()
  const showPlan = useCallback(() => {
    if (!request) return
    telemetry.queryPlanShown()
    void loadPlan(request)
  }, [loadPlan, request, telemetry])

  const explain = useCallback(async () => {
    if (!request || !canExplain) return
    telemetry.agentAction('explain')
    setExplanation({status: 'loading', url: request.url})
    const planText = currentPlan.status === 'done' ? currentPlan.result : await loadPlan(request)
    if (planText === undefined) {
      setExplanation(IDLE)
      return
    }
    try {
      const result = await explainQuery(request.client, request, planText)
      reportAiCreditsGranted(request.client)
      setExplanation({status: 'done', url: request.url, result})
    } catch (error) {
      const limit = readAiCreditsLimit(error)
      if (limit) {
        reportAiCreditsLimit(request.client, limit)
        upsell?.requestTurnedDown(limit)
      }
      setExplanation({status: 'failed', url: request.url, message: toMessage(error), limit})
    }
  }, [canExplain, currentPlan, loadPlan, request, telemetry, upsell])

  return {plan: currentPlan, explanation: currentExplanation, showPlan, explain}
}
