import {useEffect, useSyncExternalStore} from 'react'

import {type AiCredits, type AiCreditsClient, fetchAiCredits} from '../util/aiCredits'

interface AiCreditsEntry {
  credits: AiCredits | undefined
  /** When `credits` was read, so an old answer is read again */
  readAt: number
  reading: boolean
  /**
   * Stepped by every reading and every limit reported, so a reading that comes back after a
   * limit was reported is dropped: its answer is from before the request was turned down
   */
  version: number
}

/** How long a reading stands before a control that mounts reads again */
const MAX_AGE = 60_000

// The credits are the organization's, read through the project, so every control of a project
// shares one reading, across tabs and across the time the tool is left and come back to
const entries = new Map<string, AiCreditsEntry>()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function update(projectId: string, entry: AiCreditsEntry) {
  entries.set(projectId, entry)
  listeners.forEach((listener) => listener())
}

async function read(projectId: string, client: AiCreditsClient) {
  const previous = entries.get(projectId)
  const version = (previous?.version ?? 0) + 1
  update(projectId, {
    credits: previous?.credits,
    readAt: previous?.readAt ?? 0,
    reading: true,
    version,
  })
  let credits: AiCredits | undefined
  try {
    credits = await fetchAiCredits(client)
  } catch {
    // A failed reading says nothing about the credits; the controls work as if there were none
    credits = undefined
  }
  // A limit reported while this was on its way stands: the answer is from before the request
  // that hit it
  if (entries.get(projectId)?.version !== version) return
  update(projectId, {credits, readAt: Date.now(), reading: false, version})
}

/**
 * The organization's AI credits, read through the project when a control that spends them
 * mounts and the last reading is more than a minute old; `undefined` until read, and when the
 * API has nothing to say about them
 */
export function useAiCredits(client: AiCreditsClient): AiCredits | undefined {
  const {projectId} = client.config()
  const credits = useSyncExternalStore(subscribe, () =>
    projectId ? entries.get(projectId)?.credits : undefined,
  )

  useEffect(() => {
    if (!projectId) return
    const entry = entries.get(projectId)
    if (entry && (entry.reading || Date.now() - entry.readAt < MAX_AGE)) return
    void read(projectId, client)
  }, [client, projectId])

  return credits
}

/**
 * A request was turned down for the credits: every control shows the limit right away, with the
 * usage the response carried, rather than the reading from before
 */
export function reportAiCreditsLimit(client: AiCreditsClient, limit: AiCredits): void {
  const {projectId} = client.config()
  if (!projectId) return
  const version = (entries.get(projectId)?.version ?? 0) + 1
  update(projectId, {credits: limit, readAt: Date.now(), reading: false, version})
}

/**
 * A request went through: a limit reported before no longer holds (the spending limit was
 * raised, or the month turned), so the credits are read again
 */
export function reportAiCreditsGranted(client: AiCreditsClient): void {
  const {projectId} = client.config()
  if (!projectId) return
  const entry = entries.get(projectId)
  if (entry?.credits?.granted === false && !entry.reading) void read(projectId, client)
}

/** Forgets every reading; for tests */
export function resetAiCredits(): void {
  entries.clear()
}
