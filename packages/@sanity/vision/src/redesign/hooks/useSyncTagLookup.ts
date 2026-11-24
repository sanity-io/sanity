import {useCallback, useEffect, useState} from 'react'

import {
  collectSyncTagCandidates,
  resolveSyncTags,
  type SyncTagLookupClient,
  type SyncTagMeaning,
} from '../util/syncTagLookup'

/** Sync tags lookup for the shown response, from the Response panel's settings */
export interface SyncTagLookupSource {
  /** The client the response was fetched with, so probes run where its tags were computed */
  client: SyncTagLookupClient
  /** The response's result, read for the ids and slugs its tags may stand for */
  result: unknown
}

export type SyncTagLookupState =
  | {status: 'raw'}
  | {status: 'loading'}
  | {status: 'resolved'; resolved: ReadonlyMap<string, SyncTagMeaning>}
  | {status: 'failed'; message: string}

type Settled =
  | {key: string; status: 'resolved'; resolved: ReadonlyMap<string, SyncTagMeaning>}
  | {key: string; status: 'failed'; message: string}

const RAW: SyncTagLookupState = {status: 'raw'}
const LOADING: SyncTagLookupState = {status: 'loading'}

function lookupKey(client: SyncTagLookupClient, tags: readonly string[]): string {
  const {projectId, dataset, apiHost, apiVersion} = client.config()
  return JSON.stringify([projectId, dataset, apiHost, apiVersion, tags])
}

/**
 * Whether the Sync tags row shows the tags as they came or what they stand for, and the lookup
 * behind it. Nothing is asked of the API until the resolved values are first shown; while they
 * are, each new set of tags (a refetch, another query) is looked up as it arrives.
 */
export function useSyncTagLookup(
  source: SyncTagLookupSource | undefined,
  tags: readonly string[],
): {pressed: boolean; toggle: () => void; state: SyncTagLookupState} {
  const [pressed, setPressed] = useState(false)
  const [settled, setSettled] = useState<Settled>()
  const key = source && tags.length > 0 ? lookupKey(source.client, tags) : undefined
  const current = settled && settled.key === key ? settled : undefined
  const active = pressed && key !== undefined

  const needsLookup = active && !current
  useEffect(() => {
    if (!needsLookup || !source || key === undefined) return undefined
    const controller = new AbortController()
    const {signal} = controller
    resolveSyncTags(source.client, tags, {
      candidates: collectSyncTagCandidates(source.result),
      signal,
    }).then(
      (resolved) => setSettled({key, status: 'resolved', resolved}),
      (error: unknown) => {
        if (signal.aborted) return
        setSettled({
          key,
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
        })
      },
    )
    return () => controller.abort()
  }, [key, needsLookup, source, tags])

  const toggle = useCallback(() => {
    setPressed((was) => !was)
    // Showing the values again after a failed lookup tries once more
    setSettled((was) => (was?.status === 'failed' ? undefined : was))
  }, [])

  let state = RAW
  if (active) {
    if (!current) state = LOADING
    else if (current.status === 'resolved') {
      state = {status: 'resolved', resolved: current.resolved}
    } else state = {status: 'failed', message: current.message}
  }
  return {pressed: active, toggle, state}
}
