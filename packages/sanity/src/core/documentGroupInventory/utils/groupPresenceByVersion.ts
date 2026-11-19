import {type DocumentPresence} from '../../store/presence/types'

/**
 * The people who have one version open, one entry per person.
 *
 * @internal
 */
export type VersionPresence = Pick<DocumentPresence, 'user' | 'lastActiveAt' | 'documentId'>[]

const NO_PRESENCE: VersionPresence = []

/**
 * Groups presence reports by the exact version each person has open.
 *
 * The presence store reports every version of a document group together (it matches ids by their
 * published id), and each report carries the id of the version open in that person's form:
 * `drafts.<id>`, `<id>`, `versions.<release>.<id>`, or `versions.<scope>.<id>` for a variant. An
 * inventory row holds exactly one of those ids, so the reports are grouped by id, not by bundle.
 *
 * A person with the same version open in several sessions or panes counts once on that row. A
 * person with two versions open shows on both rows. Within a row, people are ordered from least to
 * most recently active, since an avatar stack shows its last entries and counts the rest.
 *
 * @internal
 */
export function groupPresenceByVersion(
  presence: Pick<DocumentPresence, 'user' | 'lastActiveAt' | 'documentId'>[],
): Map<string, VersionPresence> {
  const byVersion = new Map<string, Map<string, VersionPresence[number]>>()

  for (const report of presence) {
    const versionId = report.documentId
    if (!versionId) continue

    let people = byVersion.get(versionId)
    if (!people) {
      people = new Map()
      byVersion.set(versionId, people)
    }

    const existing = people.get(report.user.id)
    // Keep the person's most recent session on this version
    if (!existing || existing.lastActiveAt < report.lastActiveAt) {
      people.set(report.user.id, report)
    }
  }

  return new Map(
    [...byVersion].map(([versionId, people]) => [
      versionId,
      [...people.values()].sort((a, b) => a.lastActiveAt.localeCompare(b.lastActiveAt)),
    ]),
  )
}

/**
 * The people on one inventory row: those whose open version is exactly the row's version id.
 *
 * @internal
 */
export function getVersionPresence(
  presenceByVersion: Map<string, VersionPresence>,
  versionId: string,
): VersionPresence {
  return presenceByVersion.get(versionId) ?? NO_PRESENCE
}
