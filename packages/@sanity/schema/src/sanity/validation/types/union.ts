import isPlainObject from 'lodash-es/isPlainObject.js'

import {error, HELP_IDS, warning} from '../createValidationResult'
import {getDupes} from '../utils/getDupes'
import {
  formatMemberList,
  getStoredMemberName,
  hasBuiltinNameConflict,
  isObjectBackedMember,
  isUnionTypeReference,
  resolveJsonType,
} from '../utils/union'

function isPrimitiveJsonType(jsonType: string | undefined): boolean {
  return jsonType === 'string' || jsonType === 'number' || jsonType === 'boolean'
}

function getReferencedType(member: any, visitorContext: any) {
  return visitorContext.getTypeDefinition?.(member?.type) || visitorContext.getType(member?.type)
}

function validateUnionMember(member: any, index: number, visitorContext: any) {
  const problems = []

  if (!isPlainObject(member)) {
    return [
      error(
        `Found invalid union member declaration at index ${index}: expected an object declaration.`,
        HELP_IDS.UNION_OF_INVALID,
      ),
    ]
  }

  if (member.type === 'array') {
    problems.push(
      error(
        'Union members cannot be arrays. Arrays in union.of are not supported.',
        HELP_IDS.UNION_OF_INVALID,
      ),
    )
  }

  if (isUnionTypeReference(member, visitorContext)) {
    problems.push(
      error(
        'Union members cannot be nested union declarations or references to another union.',
        HELP_IDS.UNION_OF_INVALID,
      ),
    )
  }

  if (member.type === 'object' && !member.name) {
    problems.push(
      error(
        'Anonymous object union members must have a name so stored values can be distinguished.',
        HELP_IDS.UNION_OF_INVALID,
      ),
    )
  }

  if (hasBuiltinNameConflict(member)) {
    problems.push(
      error(
        `Union member declaration cannot use the built-in type name "${member.name}" as its stored member name.`,
        HELP_IDS.UNION_OF_INVALID,
      ),
    )
  }

  const jsonType = resolveJsonType(member, visitorContext)
  if (!isUnionTypeReference(member, visitorContext) && member.type !== 'array') {
    if (isPrimitiveJsonType(jsonType)) {
      problems.push(
        error(
          'Primitive union members are not supported in this version. Union members must be object-backed schema types.',
          HELP_IDS.UNION_OF_INVALID,
        ),
      )
    } else if (!isObjectBackedMember(member, visitorContext)) {
      problems.push(
        error(
          `Union member "${getStoredMemberName(
            member,
          )}" must resolve to an object-backed schema type.`,
          HELP_IDS.UNION_OF_INVALID,
        ),
      )
    }
  }

  if (getReferencedType(member, visitorContext)?.type === 'document') {
    problems.push(
      warning(
        `The type "${member.type}" is a document type and should not be used as a union member directly. Use a "reference" if you want to create a link to the document, or use "object" if you want to embed fields inline.`,
        HELP_IDS.FIELD_TYPE_IS_DOCUMENT,
      ),
    )
  }

  return problems
}

export default (typeDef: any, visitorContext: any) => {
  const ofIsArray = Array.isArray(typeDef.of)
  const problems = []

  if (!visitorContext.isRoot) {
    problems.push(
      error(
        'Inline union declarations are not supported. Define a named root union type and reference it instead.',
        HELP_IDS.UNION_OF_INVALID,
      ),
    )
  }

  if (!ofIsArray) {
    return {
      ...typeDef,
      of: [],
      _problems: [
        ...problems,
        error(
          'The union type is missing or has an invalid value for the required "of" property.',
          HELP_IDS.UNION_OF_INVALID,
        ),
      ],
    }
  }

  if (typeDef.of.length === 0) {
    problems.push(
      error('The union type must define at least one member in "of".', HELP_IDS.UNION_OF_INVALID),
    )
  }

  typeDef.of.forEach((member: any, index: number) => {
    problems.push(...validateUnionMember(member, index, visitorContext))
  })

  const membersWithStoredNames = typeDef.of.filter((member: any) => getStoredMemberName(member))
  getDupes(membersWithStoredNames, getStoredMemberName).forEach((dupes) => {
    problems.push(
      error(
        `Found duplicate union member names ${formatMemberList(
          dupes,
        )}. Union members must have unique stored names.`,
        HELP_IDS.UNION_OF_NOT_UNIQUE,
      ),
    )
  })

  return {
    ...typeDef,
    of: typeDef.of.map((ofMember: any, index: number) => visitorContext.visit(ofMember, index)),
    _problems: problems,
  }
}
