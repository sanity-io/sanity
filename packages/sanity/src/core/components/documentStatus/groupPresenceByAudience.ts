import {type DocumentPresence} from '../../store/presence/types'
import {getPublishedId} from '../../util/draftUtils'
import {type DocumentVersionStatusGroup} from './sortDocumentVersionsForStatus'

type RowPresence = Omit<DocumentPresence, 'path'>

/**
 * The key of an audience row: its variant id, or `default` for the row of the default audience.
 *
 * @internal
 */
export function audienceKey(group: DocumentVersionStatusGroup): string {
  return group.variantId ?? 'default'
}

/**
 * Who is editing which audience. Each presence report carries the id of the exact version the
 * person has open (`DocumentPresence.documentId`); the person goes on the audience row that holds
 * that version. The draft and published ids of the document are always the default audience's,
 * even before that version exists. A version that is in no row (a variant version that was just
 * created, say) puts the person on no row; the flyout puts them on its footer row.
 *
 * Returns the people per audience key, each person once, in the order they are reported.
 *
 * @internal
 */
export function groupPresenceByAudience(
  groups: DocumentVersionStatusGroup[],
  presence: RowPresence[],
): Map<string, RowPresence[]> {
  const keyByVersionId = new Map<string, string>()
  for (const group of groups) {
    for (const item of group.items) keyByVersionId.set(item.version._id, audienceKey(group))
  }

  const byAudience = new Map<string, RowPresence[]>()
  for (const entry of presence) {
    const id = entry.documentId
    if (!id) continue
    let key = keyByVersionId.get(id)
    if (!key) {
      const publishedId = getPublishedId(id)
      if (id === publishedId || id === `drafts.${publishedId}`) key = 'default'
    }
    if (!key) continue
    const people = byAudience.get(key) ?? []
    if (!people.some((person) => person.user.id === entry.user.id)) people.push(entry)
    byAudience.set(key, people)
  }
  return byAudience
}
