import {useContext, useMemo} from 'react'
import {PortableTextRootMembersContext} from 'sanity/_singletons'

import {pathToString} from '../../../../field'
import {type ArrayOfObjectsItemMember, type ArrayOfObjectsMember} from '../../../store'
import {isArrayOfObjectsFieldMember, isBlockType} from '../_helpers'
import {
  type PortableTextMemberItem,
  type PortableTextMemberItemKind,
} from './usePortableTextMemberItem'

interface OpenMemberMatch {
  member: ArrayOfObjectsItemMember
  kind: PortableTextMemberItemKind
}

function classify(
  member: ArrayOfObjectsItemMember,
  parentFieldName: string | undefined,
): PortableTextMemberItemKind {
  if (parentFieldName === 'markDefs') return 'annotation'
  if (isBlockType(member.item.schemaType)) return 'textBlock'
  if (parentFieldName === 'children') return 'inlineObject'
  return 'objectBlock'
}

function walk(
  members: ArrayOfObjectsMember[],
  parentFieldName: string | undefined,
  filter: (kind: PortableTextMemberItemKind) => boolean,
): OpenMemberMatch | undefined {
  for (const member of members) {
    if (member.kind !== 'item') continue
    const kind = classify(member, parentFieldName)
    if (member.open && filter(kind)) {
      return {member, kind}
    }
    // Recurse into any object-array fields nested inside this item
    // (container child arrays, the text-block's `children` / `markDefs`
    // arrays, or arbitrary object-block fields).
    for (const fieldMember of member.item.members) {
      if (isArrayOfObjectsFieldMember(fieldMember)) {
        const found = walk(fieldMember.field.members, fieldMember.name, filter)
        if (found) return found
      }
    }
  }
  return undefined
}

/**
 * Find the first open form-store member in the Portable Text input.
 *
 * Walks the form-store tree from the root, depth-agnostic, returning
 * the first member matching the `filter` predicate that is currently
 * `open`. Short-circuits on first match.
 *
 * Without `filter`, matches any open member. Pass a predicate to
 * restrict to specific kinds — for example, `(k) => k === 'annotation'`
 * to find the open annotation popover.
 *
 * @internal
 */
export function useOpenPortableTextMember(
  filter?: (kind: PortableTextMemberItemKind) => boolean,
): Pick<PortableTextMemberItem, 'kind' | 'key' | 'member' | 'node'> | undefined {
  const ctx = useContext(PortableTextRootMembersContext)
  if (!ctx) {
    throw new Error('Form context not provided')
  }
  const {rootMembers} = ctx
  return useMemo(() => {
    const predicate = filter ?? (() => true)
    const match = walk(rootMembers, undefined, predicate)
    if (!match) return undefined
    return {
      kind: match.kind,
      key: pathToString(match.member.item.path),
      member: match.member,
      node: match.member.item,
    }
  }, [rootMembers, filter])
}
