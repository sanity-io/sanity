import {type SanityClient} from '@sanity/client'
import {
  processSchemaSynchronization,
  type SchemaSynchronizationResult,
} from '@sanity/schema/_internal'
import {type Schema} from '@sanity/types'
import debugit from 'debug'
import {max, sum} from 'lodash'
import {firstValueFrom} from 'rxjs'

import {isDev} from '../environment'
import {getFeatures} from '../hooks/useFeatureEnabled'
import {DESCRIPTOR_CONVERTER} from '../schema'

const debug = debugit('sanity:config')

const TOGGLE = 'toggle.schema.upload-pause'

async function isEnabled(client: SanityClient): Promise<boolean> {
  if (typeof process !== 'undefined' && process?.env?.SANITY_STUDIO_SCHEMA_DESCRIPTOR) {
    return true
  }

  const {projectId} = client.config()
  if (!projectId) return false

  return firstValueFrom(getFeatures({projectId, versionedClient: client}))
    .then((features) => features.includes(TOGGLE))
    .catch((err) => {
      debug('Fetching features failed. NOT sending schema to server.', {err})
      return false
    })
}

const MAX_SYNC_ITERATIONS = 5

type ClaimRequest = {
  contextKey: string
  descriptorId: string
}

type ClaimResponse = {
  /** How long the claim is valid for. */
  expiresAt: string

  /**
   * Information to start the synchronization.
   */
  synchronization: SchemaSynchronizationResult
}

/**
 * Uploads the schema to Content Lake, returning a schema descriptor ID.
 */
export async function uploadSchema(
  schema: Schema,
  client: SanityClient,
): Promise<string | undefined> {
  if (!(await isEnabled(client))) return undefined

  // The process for uploading the schema is based around two concepts:
  //
  // We first _claim_ the descriptor ID. This means that we're requesting that
  // it should be propagated across Content Lake and be available everywhere.
  // This ensures that it will not be removed. When the claim expires there's no
  // longer a guarantee for the descriptor to exist on the server. Note that a
  // claim can be valid even if the desciptor isn't on the server.
  //
  // The claim process also includes a "context key". This is a string
  // describing the context in which the descriptor comes from. It will help the
  // server synchronize the descriptor more effectively.
  //
  // The second step is then to actually synchronize it. This is a multi-step
  // process where it tries to synchronize as much as possible in each step.

  const pauseDurations: number[] = []
  const before = performance.now()
  const sync = await DESCRIPTOR_CONVERTER.get(schema, {pauseDurations})
  const after = performance.now()

  const totalPause = sum(pauseDurations) || 0
  const maxPause = max(pauseDurations) || 0
  const avgPause = pauseDurations.length === 0 ? 0 : totalPause / pauseDurations.length
  const duration = after - before

  if (duration > 1000) {
    console.warn(`Building schema for synchronization took more than 1 second (${duration}ms)`)
  }

  if (maxPause > 100) {
    console.warn(
      `Building schema for synchronization blocked UI for more than 100ms (${maxPause}ms)`,
    )
  }

  const descriptorId = sync.set.id
  const {projectId = '?', dataset = '?'} = client.config()
  let contextKey = `dataset:${projectId}:${dataset}`
  if (isDev) contextKey += '#dev'

  const claimRequest: ClaimRequest = {descriptorId, contextKey}

  const clientTimings = {
    convertSchema: duration,
    convertSchemaPauseTotal: totalPause,
    convertSchemaPauseMax: maxPause,
    convertSchemaPauseAvg: avgPause,
  }

  const claimResponse = await client.request<ClaimResponse>({
    uri: '/descriptors/claim',
    method: 'POST',
    body: claimRequest,
    headers: {
      // We mirror the format of Server-Timing: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Server-Timing
      'Client-Timing': Object.entries(clientTimings)
        .map(([name, dur]) => `${name};dur=${dur}`)
        .join(','),
    },
  })

  let syncResult = claimResponse.synchronization
  for (let i = 0; i < MAX_SYNC_ITERATIONS; i++) {
    const syncRequest = processSchemaSynchronization(sync, syncResult)
    if (syncRequest === null) return descriptorId

    syncResult = await client.request<SchemaSynchronizationResult>({
      uri: '/descriptors/synchronize',
      method: 'POST',
      body: syncRequest,
    })
  }

  throw new Error(`Schema synchronization didn't succeed in ${MAX_SYNC_ITERATIONS} iterations`)
}
