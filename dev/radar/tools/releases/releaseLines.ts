import {releaseLineId} from '@repo/utils/radar-ids'
import {type SanityClient} from 'sanity'

/**
 * releaseLine reads and writes (see schemaTypes/releaseLine.ts): a major
 * version marked end of life. Existence is the mark — reinstating deletes.
 * Writes are fire-and-forget from the UI like the bisect sessions and drift
 * acks: the realtime listenQuery echoes the change back, failures toast.
 */

export interface ReleaseLineSlice {
  _id: string
  major: number
  eolMarkedAt: string | null
  eolMarkedBy: string | null
  note: string | null
}

export const RELEASE_LINES_QUERY = `*[_type == "releaseLine"]{
  _id, major, eolMarkedAt, eolMarkedBy, note
}`

export async function markLineEol(
  client: SanityClient,
  input: {major: number; markedBy: string},
): Promise<void> {
  await client.createOrReplace({
    _id: releaseLineId(input.major),
    _type: 'releaseLine',
    major: input.major,
    eolMarkedAt: new Date().toISOString(),
    eolMarkedBy: input.markedBy,
  })
}

export async function clearLineEol(client: SanityClient, major: number): Promise<void> {
  await client.delete(releaseLineId(major))
}
