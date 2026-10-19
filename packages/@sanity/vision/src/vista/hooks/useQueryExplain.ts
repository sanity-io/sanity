import {useCallback, useState} from 'react'

import {type QueryRequest} from '../store/types'
import {explainQuery, fetchQueryPlan} from '../util/explainQuery'

export type ExplainStep =
  | {status: 'idle'}
  | {status: 'loading'; url: string}
  | {status: 'done'; url: string; text: string}
  | {status: 'failed'; url: string; message: string}

const IDLE: ExplainStep = {status: 'idle'}

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
  const [explanation, setExplanation] = useState<ExplainStep>(IDLE)
  const url = request?.url
  const currentPlan = plan.status !== 'idle' && plan.url === url ? plan : IDLE
  const currentExplanation =
    explanation.status !== 'idle' && explanation.url === url ? explanation : IDLE

  const loadPlan = useCallback(async (current: QueryRequest): Promise<string | undefined> => {
    setPlan({status: 'loading', url: current.url})
    try {
      const text = await fetchQueryPlan(current.client, current)
      setPlan({status: 'done', url: current.url, text})
      return text
    } catch (error) {
      setPlan({status: 'failed', url: current.url, message: toMessage(error)})
      return undefined
    }
  }, [])

  const showPlan = useCallback(() => {
    if (request) void loadPlan(request)
  }, [loadPlan, request])

  const explain = useCallback(async () => {
    if (!request) return
    setExplanation({status: 'loading', url: request.url})
    const planText = currentPlan.status === 'done' ? currentPlan.text : await loadPlan(request)
    if (planText === undefined) {
      setExplanation(IDLE)
      return
    }
    try {
      const text = await explainQuery(request.client, request, planText)
      setExplanation({status: 'done', url: request.url, text})
    } catch (error) {
      setExplanation({status: 'failed', url: request.url, message: toMessage(error)})
    }
  }, [currentPlan, loadPlan, request])

  return {plan: currentPlan, explanation: currentExplanation, showPlan, explain}
}
