import {isKeySegment, type Path} from '@sanity/types'

import {
  type ArrayOfObjectsItemMember,
  type ArrayOfObjectsMember,
  type FieldMember,
  type ObjectMember,
} from '../../../store'
import {isArrayOfObjectsFieldMember} from '../_helpers'

/**
 * Resolve the form-store member at a given path.
 *
 * Walks the form-store tree by path segments, matching keyed segments
 * against array members by `_key` and string segments against object
 * fields by name. Depth-agnostic — descends through any nesting of
 * containers and object blocks until the target is reached or a segment
 * fails to resolve.
 *
 * Returns the deepest member resolved: an `ArrayOfObjectsItemMember`
 * when the path ends on a keyed segment (e.g. a block, inline child, or
 * annotation), a `FieldMember` when it ends on a field name (e.g. an
 * object-block field path), or `undefined` when any segment doesn't
 * resolve.
 *
 * The path is interpreted relative to `ptInputPath` — the outer Portable
 * Text input's path within the document.
 *
 * @internal
 */
export function resolveMemberAtPath(
  rootMembers: ArrayOfObjectsMember[],
  ptInputPath: Path,
  targetPath: Path,
): ArrayOfObjectsItemMember | FieldMember | undefined {
  if (targetPath.length < ptInputPath.length) {
    return undefined
  }
  const relative = targetPath.slice(ptInputPath.length)
  if (relative.length === 0) {
    return undefined
  }

  let arrayMembers: ArrayOfObjectsMember[] | undefined = rootMembers
  let lastItem: ArrayOfObjectsItemMember | undefined
  let lastField: FieldMember | undefined

  for (const segment of relative) {
    if (isKeySegment(segment)) {
      if (!arrayMembers) {
        return undefined
      }
      const item = arrayMembers.find(
        (member): member is ArrayOfObjectsItemMember =>
          member.kind === 'item' && member.key === segment._key,
      )
      if (!item) {
        return undefined
      }
      lastItem = item
      lastField = undefined
      arrayMembers = undefined
    } else if (typeof segment === 'string') {
      if (!lastItem) {
        return undefined
      }
      const field = lastItem.item.members.find(
        (member: ObjectMember): member is FieldMember =>
          member.kind === 'field' && member.name === segment,
      )
      if (!field) {
        return undefined
      }
      lastField = field
      lastItem = undefined
      arrayMembers = isArrayOfObjectsFieldMember(field) ? field.field.members : undefined
    } else {
      return undefined
    }
  }

  return lastItem ?? lastField
}
