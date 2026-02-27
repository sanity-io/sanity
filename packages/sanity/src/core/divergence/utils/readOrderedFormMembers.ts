import {type Path} from '@sanity/types'
import {type Observable, concatWith, filter, from, map, merge, mergeMap, of, switchMap} from 'rxjs'

import {
  type FormState,
  type ArrayOfObjectsItemMember,
  type FieldMember,
  type ArrayOfObjectsMember,
  type ArrayOfPrimitivesMember,
  type ArrayOfPrimitivesItemMember,
  type ObjectArrayFormNode,
  type BaseFormNode,
} from '../../form'
import {
  isArrayOfObjectsFormNode,
  isArrayOfPrimitivesFormNode,
  isObjectFormNode,
} from '../../form/store/types/asserters'

type Member = FieldMember | ArrayOfObjectsItemMember | ArrayOfPrimitivesItemMember

type MemberAtPath = [path: Path, member: Member]

interface Context {
  groups?: FormState['groups']
  members: FormState['_allMembers'] | ArrayOfObjectsMember[] | ArrayOfPrimitivesMember[]
}

/**
 * Read form members in the order they appear, accounting for groups. If a field
 * appears in multiple groups, it'll be emitted each time it appears.
 *
 * Each member is emitted as a `[path, member]` tuple.
 *
 * This can be used in operations that derive state based on the way form
 * members are presented in the document editor. For example, to create a
 * navigable outline of the form.
 *
 * @internal
 */
export function readOrderedFormMembers({groups, members = []}: Context): Observable<MemberAtPath> {
  const hasGroups = typeof groups !== 'undefined'

  const grouplessMembers = from(members).pipe(
    filter(isFieldMember),
    filter(({groups: memberGroups}) => {
      if (typeof groups === 'undefined') {
        return true
      }

      return !groups.some((group) => memberGroups.some((memberGroup) => memberGroup === group.name))
    }),
  )

  const source = hasGroups
    ? from(groups).pipe(
        switchMap((group) =>
          from(members).pipe(
            filter(isFieldMember),
            filter(({groups: memberGroups}) => memberGroups.includes(group.name)),
          ),
        ),
      )
    : from(members)

  return merge(grouplessMembers, source).pipe(
    filter(isFieldOrArrayMember),
    map((member) => {
      const subject = selectSubject(member)
      return [subject.path, member]
    }),
    mergeMap<MemberAtPath, Observable<MemberAtPath>>((memberAtPath) => {
      const [, member] = memberAtPath
      const subject = selectSubject(member)

      if (isObjectFormNode(subject)) {
        return of(memberAtPath).pipe(
          concatWith(
            readOrderedFormMembers({
              groups: subject.groups,
              members: subject._allMembers,
            }),
          ),
        )
      }

      if (isArrayOfObjectsFormNode(subject) || isArrayOfPrimitivesFormNode(subject)) {
        return of(memberAtPath).pipe(
          concatWith(
            readOrderedFormMembers({
              members: subject.members,
            }),
          ),
        )
      }

      return of(memberAtPath)
    }),
  )
}

function selectSubject(member: Member): BaseFormNode | ObjectArrayFormNode {
  return member.kind === 'field' ? member.field : member.item
}

function isFieldMemberLike(maybeFieldMemberLike: unknown): maybeFieldMemberLike is {kind: string} {
  return (
    typeof maybeFieldMemberLike === 'object' &&
    maybeFieldMemberLike !== null &&
    'kind' in maybeFieldMemberLike &&
    typeof maybeFieldMemberLike.kind === 'string'
  )
}

function isFieldMember(maybeFieldMember: unknown): maybeFieldMember is FieldMember {
  return isFieldMemberLike(maybeFieldMember) && maybeFieldMember.kind === 'field'
}

function isFieldOrArrayMember(
  maybeFieldOrArrayMember: unknown,
): maybeFieldOrArrayMember is FieldMember | ArrayOfObjectsItemMember | ArrayOfPrimitivesItemMember {
  return (
    isFieldMemberLike(maybeFieldOrArrayMember) &&
    ['field', 'item'].includes(maybeFieldOrArrayMember.kind)
  )
}
