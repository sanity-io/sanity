import humanizeList from 'humanize-list'
import flatten from 'lodash-es/flatten.js'
import partition from 'lodash-es/partition.js'

import {coreTypeNames} from '../../coreTypes'
import {error, HELP_IDS, warning} from '../createValidationResult'
import {getDupes} from '../utils/getDupes'
import {
  getStoredMemberName,
  isCompatibleMemberOverride,
  isNamedUnionTypeReference,
  resolveJsonType,
} from '../utils/union'

function isPrimitiveTypeName(typeName: any) {
  return typeName === 'string' || typeName === 'number' || typeName === 'boolean'
}

function isAssignable(typeName: any, type: any) {
  return (typeof type.name === 'string' ? type.name : type.type) === typeName
}

function quote(n: any) {
  return `"${n}"`
}

function pluralize(arr: unknown[], suf = 's') {
  return arr.length === 1 ? '' : suf
}

function format(value: unknown) {
  if (Array.isArray(value)) {
    return `array with ${value.length} entries`
  }
  if (typeof value === 'object' && value !== null) {
    return `object with keys ${humanizeList(Object.keys(value).map(quote))}`
  }
  return quote(value)
}

function getUnionDefinition(member: any, visitorContext: any) {
  return visitorContext.getTypeDefinition?.(member?.type)
}

function createUnionMemberOverrideWarning(member: any) {
  return warning(
    `Array member "${getStoredMemberName(
      member,
    )}" overrides a compatible member expanded from a union declaration.`,
    HELP_IDS.ARRAY_OF_UNION_MEMBER_OVERRIDE,
  )
}

function expandUnionMembers(members: any[], visitorContext: any) {
  const problems: any[] = []
  let entries: {member: any; source: 'direct' | 'union'}[] = []
  const warnedDirectMembers = new Set<any>()

  function addEntry(member: any, source: 'direct' | 'union') {
    if (source === 'direct') {
      let replacedUnionMember = false
      entries = entries.flatMap((entry) => {
        if (
          entry.source === 'union' &&
          isCompatibleMemberOverride(member, entry.member, visitorContext)
        ) {
          if (!replacedUnionMember) {
            replacedUnionMember = true
            return [{member, source}]
          }

          return []
        }

        return [entry]
      })

      if (replacedUnionMember) {
        problems.push(createUnionMemberOverrideWarning(member))
        warnedDirectMembers.add(member)
        return
      }
    }

    if (source === 'union') {
      const compatibleEntry = entries.find((entry) =>
        isCompatibleMemberOverride(member, entry.member, visitorContext),
      )

      if (compatibleEntry) {
        if (
          compatibleEntry.source === 'direct' &&
          !warnedDirectMembers.has(compatibleEntry.member)
        ) {
          problems.push(createUnionMemberOverrideWarning(compatibleEntry.member))
          warnedDirectMembers.add(compatibleEntry.member)
        }

        return
      }
    }

    entries.push({member, source})
  }

  members.forEach((member) => {
    if (isNamedUnionTypeReference(member, visitorContext)) {
      const unionDefinition = getUnionDefinition(member, visitorContext)
      const unionMembers = Array.isArray(unionDefinition?.of) ? unionDefinition.of : []

      unionMembers.forEach((unionMember: any) => addEntry(unionMember, 'union'))
      return
    }

    addEntry(member, 'direct')
  })

  return {of: entries.map((entry) => entry.member), problems}
}

export default (typeDef: any, visitorContext: any) => {
  // name should already have been marked
  const ofIsArray = Array.isArray(typeDef.of)
  const expanded = ofIsArray
    ? expandUnionMembers(typeDef.of, visitorContext)
    : {of: [], problems: []}
  const of = expanded.of

  if (ofIsArray) {
    const invalid = of.reduce((errs: any, def: any, idx: any) => {
      if (typeof def.name === 'string') {
        // If an array member has been given a "local" type name, we want to trigger an error if the given member type name
        // is one of the builtin types
        //
        // The following examples should be an error (where book is an existing root level type and reference is a built-in type):
        //  - (…) of: [{type: 'book', name: 'image'}]
        //  - (…) of: [{type: 'book', name: 'object'}]
        //  - (…) of: [{type: 'object', name: 'reference'}]
        // The following examples are valid (where "address" is not defined as a global object type)
        //  - (…) of: [{type: 'object', name: 'address'}]
        // The following examples are redundant, but should be allowed (at least for now)
        //  - (…) of: [{type: 'object', name: 'object'}]
        //  - (…) of: [{type: 'image', name: 'image'}]

        if (
          // specifying the same name as the type is redundant, but should not be a hard error at this point
          // Consider showing a warning for this and deprecate this ability eventually
          def.name !== def.type &&
          coreTypeNames.includes(def.name)
        ) {
          return errs.concat(
            error(
              `Found array member declaration with the same type name as a built-in type ("${def.name}"). Array members can not be given the same name as a built-in type.`,
              HELP_IDS.ARRAY_OF_TYPE_BUILTIN_TYPE_CONFLICT,
            ),
          )
        }
      }

      if (def.type === 'object' && def.name && visitorContext.getType(def.name)) {
        return errs.concat(
          warning(
            `Found array member declaration with the same name as the global schema type "${def.name}". It's recommended to use a unique name to avoid possibly incompatible data types that shares the same name.`,
            HELP_IDS.ARRAY_OF_TYPE_GLOBAL_TYPE_CONFLICT,
          ),
        )
      }
      if (def.type === 'array') {
        return errs.concat(
          error(
            `Found array member declaration of type "array" - multidimensional arrays are not currently supported by Sanity`,
            HELP_IDS.ARRAY_OF_ARRAY,
          ),
        )
      }

      if (def) {
        return errs
      }

      const err = `Found ${def === null ? 'null' : typeof def}, expected member declaration`
      return errs.concat(
        error(
          `Found invalid type member declaration in array at index ${idx}: ${err}`,
          HELP_IDS.ARRAY_OF_INVALID,
        ),
      )
    }, [])

    if (invalid.length > 0) {
      return {
        ...typeDef,
        of: [],
        _problems: invalid,
      }
    }
  }

  const problems = flatten([
    expanded.problems,
    ofIsArray
      ? getDupes(of, (t) => `${t.name};${t.type}`).map((dupes) =>
          error(
            `Found ${dupes.length} members with same type, but not unique names "${dupes[0].type}" in array. This makes it impossible to tell their values apart and you should consider naming them`,
            HELP_IDS.ARRAY_OF_NOT_UNIQUE,
          ),
        )
      : error(
          'The array type is missing or having an invalid value for the required "of" property',
          HELP_IDS.ARRAY_OF_INVALID,
        ),
  ])

  // Don't allow object types without a name in block arrays
  const hasObjectTypesWithoutName = of.some(
    (type: any) => type.type === 'object' && typeof type.name === 'undefined',
  )
  const hasBlockType = of.some((ofType: any) => ofType.type === 'block')
  if (hasBlockType && hasObjectTypesWithoutName) {
    problems.push(
      error(
        "The array type's 'of' property can't have an object type without a 'name' property as member, when the 'block' type is also a member of that array.",
        HELP_IDS.ARRAY_OF_INVALID,
      ),
    )
  }

  const [primitiveTypes, objectTypes] = partition(
    of,
    (ofType) =>
      isPrimitiveTypeName(ofType.type) ||
      isPrimitiveTypeName(resolveJsonType(ofType, visitorContext)),
  )

  const isMixedArray = primitiveTypes.length > 0 && objectTypes.length > 0

  if (isMixedArray) {
    const primitiveTypeNames = primitiveTypes.map((t) => t.type)
    const objectTypeNames = objectTypes.map((t) => t.type)
    problems.push(
      error(
        `The array type's 'of' property can't have both object types and primitive types (found primitive type ${pluralize(
          primitiveTypeNames,
        )} ${humanizeList(primitiveTypeNames.map(quote))} and object type${pluralize(
          objectTypeNames,
        )} ${humanizeList(objectTypeNames.map(quote))})`,
        HELP_IDS.ARRAY_OF_INVALID,
      ),
    )
  }

  // Check for multiple primitive types that resolve to the same JSON type
  // e.g. both "string" and "text" resolve to JSON type "string"
  if (primitiveTypes.length > 1) {
    const primitivesByJsonType = new Map<string, any[]>()
    for (const primitiveType of primitiveTypes) {
      const jsonType = resolveJsonType(primitiveType, visitorContext)
      if (jsonType && isPrimitiveTypeName(jsonType)) {
        const existing = primitivesByJsonType.get(jsonType) || []
        existing.push(primitiveType)
        primitivesByJsonType.set(jsonType, existing)
      }
    }

    for (const [jsonType, types] of primitivesByJsonType) {
      if (types.length > 1) {
        const typeNames = types.map((t) => t.name || t.type)
        problems.push(
          warning(
            `Array cannot contain multiple members with JSON type "${jsonType}" (${humanizeList(typeNames.map(quote))}) as there is no way to distinguish between them`,
            HELP_IDS.ARRAY_OF_DUPLICATE_PRIMITIVE_JSON_TYPE,
          ),
        )
      }
    }
  }

  const list = typeDef?.options?.list
  if (!isMixedArray && Array.isArray(list)) {
    const isArrayOfPrimitives = primitiveTypes.length > 0
    if (isArrayOfPrimitives) {
      list.forEach((option) => {
        const value = option?.value ?? option
        const isDeclared = primitiveTypes.some((primitiveType) => {
          return typeof value === resolveJsonType(primitiveType, visitorContext)
        })
        if (!isDeclared) {
          const formattedTypeList = humanizeList(
            primitiveTypes.map((t) => t.name || t.type),
            {conjunction: 'or'},
          )
          problems.push(
            error(
              `An invalid entry found in options.list: ${format(
                value,
              )}. Must be either a value of type ${formattedTypeList}, or an object with {title: string, value: ${formattedTypeList}}`,
              HELP_IDS.ARRAY_PREDEFINED_CHOICES_INVALID,
            ),
          )
        }
      })
    } else {
      list.forEach((option) => {
        const optionTypeName = option._type || 'object'
        const isDeclared = objectTypes.some((validObjectType) =>
          isAssignable(optionTypeName, validObjectType),
        )
        if (!isDeclared) {
          problems.push(
            error(
              `An invalid entry found in options.list: ${format(
                option,
              )}. Must be an object with "_type" set to ${humanizeList(
                objectTypes
                  .map((t) => t.name || t.type)
                  .map((t) => (t === 'object' ? 'undefined' : quote(t))),
                {conjunction: 'or'},
              )}`,
              HELP_IDS.ARRAY_PREDEFINED_CHOICES_INVALID,
            ),
          )
        }
      })
    }
  }

  if (typeDef?.options?.list && typeDef?.options?.layout === 'tags') {
    problems.push(
      warning(
        'Found array member declaration with both tags layout and a list of predefined values. If you want to display a list of predefined values, remove the tags layout from `options`.',
      ),
    )
  }

  return {
    ...typeDef,
    of: of.map((ofMember: any, index: number) => {
      const visited = visitorContext.visit(ofMember, index)

      if (
        ofMember.type &&
        typeof ofMember.type === 'string' &&
        visitorContext.getType(ofMember.type)?.type === 'document'
      ) {
        return {
          ...visited,
          _problems: [
            ...(visited._problems || []),
            warning(
              `The type "${ofMember.type}" is a document type and should not be used as a field type directly. Use a "reference" if you want to create a link to the document, or use "object" if you want to embed fields inline.`,
              HELP_IDS.FIELD_TYPE_IS_DOCUMENT,
            ),
          ],
        }
      }

      return visited
    }),
    _problems: problems,
  }
}
