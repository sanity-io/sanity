import {type SanityDocument} from '@sanity/types'

import {getPublishedId} from '../../util/draftUtils'
import {isGoingToUnpublish} from '../util/isGoingToUnpublish'

/**
 * Where a release member's content lives.
 *
 * Today every member is a version inside the release bundle (`versions.<releaseId>.<id>`). In the
 * planned release model a release holds no content: its members point at a lane of a document
 * group, either the Default draft or a variant. Features read the lane through this type and the
 * {@link ReleaseMemberImpact} below, never from the document id, so they keep working when the
 * second and third kinds start to appear.
 *
 * @internal
 */
export type ReleaseMemberLane =
  | {kind: 'release-version'; versionId: string}
  | {kind: 'default-draft'}
  | {kind: 'variant'; variantId: string}

/**
 * What running the release does to one document group's published content.
 *
 * - `add`: the group has no published document yet; running the release creates it.
 * - `update`: the published document is replaced.
 * - `unpublish`: the published document is removed (its content is kept as a draft).
 *
 * @internal
 */
export type ReleaseMemberEffect = 'add' | 'update' | 'unpublish'

/** @internal */
export interface ReleaseMemberImpact {
  /** The document group, keyed by the published id. Both release models key members this way. */
  groupId: string
  documentType: string
  lane: ReleaseMemberLane
  effect: ReleaseMemberEffect
  /**
   * The group's Default draft holds changes that are not in this release, so after the run the
   * draft and the published document differ. In the planned model this is the "Default moved"
   * case that reconcile handles; today it is a draft that exists next to the version.
   */
  draftDiffers: boolean
}

/**
 * The document fields the impact is derived from. A release document as the releases store
 * returns it: the version, plus whether a published document and a draft exist for its group.
 *
 * @internal
 */
export type ReleaseMemberSource = Pick<SanityDocument, '_id' | '_type'> &
  Partial<Pick<SanityDocument, '_system'>> & {
    publishedDocumentExists: boolean
    draftDocumentExists?: boolean
  }

/**
 * Maps a document in a release (today's bundle model) to its impact.
 *
 * This is the only function that knows how today's model stores a member. A future adapter for
 * pointer-based releases returns the same shape from the release's membership instead.
 *
 * @internal
 */
export function getReleaseMemberImpact(document: ReleaseMemberSource): ReleaseMemberImpact {
  const unpublishing = isGoingToUnpublish(document)
  let effect: ReleaseMemberEffect = 'add'
  if (unpublishing) effect = 'unpublish'
  else if (document.publishedDocumentExists) effect = 'update'

  return {
    groupId: getPublishedId(document._id),
    documentType: document._type,
    lane: {kind: 'release-version', versionId: document._id},
    effect,
    // Unpublishing keeps or creates a draft on purpose, so it never counts as a draft that differs.
    draftDiffers: Boolean(document.draftDocumentExists) && !unpublishing,
  }
}

/** @internal */
export function getReleaseImpact(
  documents: ReadonlyArray<{document: ReleaseMemberSource}>,
): ReleaseMemberImpact[] {
  return documents.map(({document}) => getReleaseMemberImpact(document))
}

/**
 * Whether two releases that share a document group change the same content in it.
 *
 * In the planned model a member points at a lane of a group, and two releases that write
 * different variants of one group leave each other's content alone. Today's members are all
 * versions of the whole group, so any two of them collide. An unknown lane counts as colliding:
 * a missed overwrite costs more than an extra hint.
 *
 * {@link findSharedGroups} keys by group only. When membership carries lanes, callers drop the
 * pairs this returns `false` for.
 *
 * @internal
 */
export function lanesCollide(a?: ReleaseMemberLane, b?: ReleaseMemberLane): boolean {
  if (a?.kind === 'variant' && b?.kind === 'variant') return a.variantId === b.variantId
  // A variant lane and the Default draft lane hold different content in the planned model.
  if (
    (a?.kind === 'variant' && b?.kind === 'default-draft') ||
    (a?.kind === 'default-draft' && b?.kind === 'variant')
  ) {
    return false
  }
  return true
}

/**
 * Groups that are members of more than one release, keyed by group id, with the ids of the
 * releases that contain each of them. Input is each release's member group ids.
 *
 * Model neutral: both models key membership by document group, so a group in two releases is a
 * collision in either.
 *
 * @internal
 */
export function findSharedGroups(
  groupIdsByRelease: ReadonlyMap<string, ReadonlyArray<string>>,
): Map<string, string[]> {
  const releasesByGroup = new Map<string, string[]>()
  for (const [releaseId, groupIds] of groupIdsByRelease) {
    for (const groupId of new Set(groupIds)) {
      const releases = releasesByGroup.get(groupId)
      if (releases) releases.push(releaseId)
      else releasesByGroup.set(groupId, [releaseId])
    }
  }
  for (const [groupId, releases] of releasesByGroup) {
    if (releases.length < 2) releasesByGroup.delete(groupId)
  }
  return releasesByGroup
}
