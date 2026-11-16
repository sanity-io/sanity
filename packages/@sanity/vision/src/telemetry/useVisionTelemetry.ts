import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'

import {
  VisionAgentActionInvoked,
  VisionApiVersionChanged,
  VisionCopied,
  VisionDatasetChanged,
  VisionLintUsed,
  VisionParamsUsed,
  VisionPerspectiveChanged,
  VisionQueryPrettified,
  VisionQueryRun,
  VisionSnippetCopied,
  VisionTabsChanged,
  type VisionQueryRunData,
} from './vision.telemetry'

export interface VisionTelemetry {
  queryRun: (data: VisionQueryRunData) => void
  datasetChanged: () => void
  perspectiveChanged: () => void
  apiVersionChanged: (custom: boolean) => void
  copied: (target: 'query' | 'url') => void
  agentAction: (action: 'generate-query' | 'generate-mutations' | 'explain') => void
  tabsChanged: (count: number, action: 'open' | 'add' | 'close') => void
  queryPrettified: (outcome: 'success' | 'error') => void
  lintUsed: (action: 'open' | 'fix') => void
  snippetCopied: (snippet: 'curl' | 'client' | 'next-sanity') => void
}

/** Adoption events for the Vision tool. See `vision.telemetry.ts`. */
export function useVisionTelemetry(): VisionTelemetry {
  const telemetry = useTelemetry()

  const queryRun = useCallback(
    (data: VisionQueryRunData) => {
      telemetry.log(VisionQueryRun, data)
      if (data.hasParams) telemetry.log(VisionParamsUsed, {mode: data.mode})
    },
    [telemetry],
  )

  const datasetChanged = useCallback(() => {
    telemetry.log(VisionDatasetChanged)
  }, [telemetry])

  const perspectiveChanged = useCallback(() => {
    telemetry.log(VisionPerspectiveChanged)
  }, [telemetry])

  const apiVersionChanged = useCallback(
    (custom: boolean) => {
      telemetry.log(VisionApiVersionChanged, {custom})
    },
    [telemetry],
  )

  const copied = useCallback(
    (target: 'query' | 'url') => {
      telemetry.log(VisionCopied, {target})
    },
    [telemetry],
  )

  const agentAction = useCallback(
    (action: 'generate-query' | 'generate-mutations' | 'explain') => {
      telemetry.log(VisionAgentActionInvoked, {action})
    },
    [telemetry],
  )

  const tabsChanged = useCallback(
    (count: number, action: 'open' | 'add' | 'close') => {
      telemetry.log(VisionTabsChanged, {count, action})
    },
    [telemetry],
  )

  const queryPrettified = useCallback(
    (outcome: 'success' | 'error') => {
      telemetry.log(VisionQueryPrettified, {outcome})
    },
    [telemetry],
  )

  const lintUsed = useCallback(
    (action: 'open' | 'fix') => {
      telemetry.log(VisionLintUsed, {action})
    },
    [telemetry],
  )

  const snippetCopied = useCallback(
    (snippet: 'curl' | 'client' | 'next-sanity') => {
      telemetry.log(VisionSnippetCopied, {snippet})
    },
    [telemetry],
  )

  return useMemo(
    (): VisionTelemetry => ({
      queryRun,
      datasetChanged,
      perspectiveChanged,
      apiVersionChanged,
      copied,
      agentAction,
      tabsChanged,
      queryPrettified,
      lintUsed,
      snippetCopied,
    }),
    [
      agentAction,
      apiVersionChanged,
      copied,
      datasetChanged,
      lintUsed,
      perspectiveChanged,
      queryPrettified,
      queryRun,
      snippetCopied,
      tabsChanged,
    ],
  )
}
