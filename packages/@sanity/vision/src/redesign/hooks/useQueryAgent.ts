import {type SanityClient} from '@sanity/client'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {useAiCreditsUpsell} from '../components/AiCreditsUpsellContext'
import {type VisionTab} from '../store/types'
import {useVisionActor} from '../store/VisionActorContext'
import {type AiCredits, readAiCreditsLimit} from '../util/aiCredits'
import {type GeneratedQuery, generatedQueryComment, GenerateQueryError} from '../util/generateQuery'
import {reportAiCreditsGranted, reportAiCreditsLimit} from './useAiCredits'

export type QueryAgentStatus =
  | {type: 'idle'}
  | {type: 'running'; attempt: number}
  | {
      type: 'failed'
      message: string
      /** The description the attempts were written from, if the user wrote one */
      prompt: string | undefined
      lastAttempt: GeneratedQuery | undefined
      /** Whether the tab's own params text stays when the last attempt is opened */
      keepParams: boolean
      /** The credits the request was turned down for, when that is what failed */
      limit: AiCredits | undefined
    }

/** What an Agent Actions request for a query is given */
export interface QueryAgentRequest {
  client: SanityClient
  signal: AbortSignal
  onAttempt: (attempt: number) => void
}

export interface QueryAgentOpenOptions {
  /** Starts the query with a comment naming the description it was generated from */
  prompt?: string
  /** Runs the query once it is in the editor */
  fetch: boolean
  /**
   * Leaves the tab's params text as it is. For a request that started from params that did not
   * parse, which went to the model as empty: what it made up must not replace what the user typed.
   */
  keepParams?: boolean
}

export interface UseQueryAgentOptions {
  tab: VisionTab
  /** The tab's client: attempts are checked with its dataset, API version and perspective */
  client: SanityClient
  /** Formats the query for the query editor, as Prettify does */
  formatForEditor: (query: string) => Promise<string>
  /** Called once a query is in the editor */
  onOpened?: () => void
}

/**
 * Runs an Agent Actions request that writes the tab's query, tracks its attempts and failure, and
 * puts the result in the editor.
 */
export function useQueryAgent({tab, client, formatForEditor, onOpened}: UseQueryAgentOptions) {
  const actorRef = useVisionActor()
  const upsell = useAiCreditsUpsell()
  const [status, setStatus] = useState<QueryAgentStatus>({type: 'idle'})
  const controllerRef = useRef<AbortController | null>(null)

  // Hiding a query tab or Vision tears this effect down (Activity) and aborts the request; the
  // component stays mounted with its state, so the status has to go back to idle or Fix with AI
  // (and the prompt bar) stay stuck on "running" with their buttons disabled
  useEffect(
    () => () => {
      controllerRef.current?.abort()
      setStatus({type: 'idle'})
    },
    [],
  )

  // The editors replace their content in one undoable step, so undo brings back what the tab had;
  // the query is formatted first so that step is the only one. Undo does not bring back a title,
  // so only an empty tab without one is named after the result: a title the tab was given stays,
  // and one derived from its query goes on following the query. The comment naming the
  // description goes in after formatting, so the formatter cannot reflow it.
  const open = useCallback(
    async (generated: GeneratedQuery, options: QueryAgentOpenOptions, signal?: AbortSignal) => {
      const formatted = await formatForEditor(generated.query).catch(() => generated.query)
      if (signal?.aborted) return
      const query =
        options.prompt === undefined
          ? formatted
          : `${generatedQueryComment(options.prompt)}${formatted}`
      const named = tab.title === undefined && !tab.query.trim()
      actorRef.send({
        type: 'tab.load',
        id: tab.id,
        tab: {
          query,
          ...(options.keepParams ? {} : {rawParams: JSON.stringify(generated.params, null, 2)}),
          ...(named ? {title: generated.title} : {}),
        },
        fetch: options.fetch ? 'generated' : undefined,
      })
      setStatus({type: 'idle'})
      onOpened?.()
    },
    [actorRef, formatForEditor, onOpened, tab.id, tab.query, tab.title],
  )

  const run = useCallback(
    async (
      ask: (request: QueryAgentRequest) => Promise<GeneratedQuery>,
      options: {prompt?: string; comment: boolean; keepParams?: boolean},
    ) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      setStatus({type: 'running', attempt: 1})
      const clearIfCurrent = () => {
        // A superseded run has already replaced the controller; leave its status alone
        if (controllerRef.current === controller) setStatus({type: 'idle'})
      }
      try {
        const generated = await ask({
          client,
          signal: controller.signal,
          onAttempt: (attempt) => setStatus({type: 'running', attempt}),
        })
        reportAiCreditsGranted(client)
        await open(
          generated,
          {
            prompt: options.comment ? options.prompt : undefined,
            fetch: true,
            keepParams: options.keepParams,
          },
          controller.signal,
        )
        // open returns without writing when the request was aborted mid-format
        if (controller.signal.aborted) clearIfCurrent()
      } catch (error) {
        if (controller.signal.aborted) {
          clearIfCurrent()
          return
        }
        const limit = readAiCreditsLimit(error)
        if (limit) {
          reportAiCreditsLimit(client, limit)
          upsell?.requestTurnedDown(limit)
        }
        setStatus({
          type: 'failed',
          message: error instanceof Error ? error.message : String(error),
          prompt: options.comment ? options.prompt : undefined,
          lastAttempt: error instanceof GenerateQueryError ? error.lastAttempt : undefined,
          keepParams: options.keepParams === true,
          limit,
        })
      }
    },
    [client, open, upsell],
  )

  /** Opens the last rejected attempt, without running it */
  const openLastAttempt = useCallback(() => {
    if (status.type !== 'failed' || !status.lastAttempt) return
    void open(status.lastAttempt, {
      prompt: status.prompt,
      fetch: false,
      keepParams: status.keepParams,
    })
  }, [open, status])

  return useMemo(() => ({status, run, openLastAttempt}), [status, run, openLastAttempt])
}

/** What a component gets from `useQueryAgent`: the request's state, and how to run one */
export type QueryAgent = ReturnType<typeof useQueryAgent>
