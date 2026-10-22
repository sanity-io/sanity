// The version list the C3 parts draw. The shape is the Storybook exploration's `AudienceVersion`
// (doc/nordic.ts), fed live by ../data/versions.ts instead of fixtures. 'undecided' and `scheduledDraft` are now
// upstream (Storybook 9748ea43e0); the real timestamps and bundle id for the time line exist only here.
import {type AudienceVersion} from '../data/versions'

export type {AudienceVersion, VersionState as State} from '../data/versions'

export interface AudienceLine {
  audience: string
  states: AudienceVersion[]
}

/** One line per audience, in first-seen order. */
export function audienceLines(versions: readonly AudienceVersion[]): AudienceLine[] {
  const lines: AudienceLine[] = []
  for (const v of versions) {
    if (v.audience === null) continue
    let line = lines.find((l) => l.audience === v.audience)
    if (!line) lines.push((line = {audience: v.audience, states: []}))
    line.states.push(v)
  }
  return lines
}

/** The control shows only when there is more than a draft and a published version: variants or releases attached. */
export const hasMoreThanBase = (versions: readonly AudienceVersion[]) =>
  versions.some(
    (v) =>
      v.audience !== null ||
      v.state === 'scheduled' ||
      v.state === 'asap' ||
      v.state === 'undecided',
  )

/**
 * The one dot for the BASE document: a disc when published, a ring when in draft (the ring wins).
 * LIVE: with no base document (it exists only in a release) there is no badge at all; the Storybook original
 * fell back to the other versions' states, which would fake a ring. Decided in the handoff, 19 Oct.
 */
export function baseDot(versions: readonly AudienceVersion[]): 'published' | 'draft' | null {
  const base = versions.filter(
    (v) => v.audience === null && (v.state === 'published' || v.state === 'draft'),
  )
  if (!base.length) return null
  return base.some((v) => v.state === 'draft') ? 'draft' : 'published'
}
