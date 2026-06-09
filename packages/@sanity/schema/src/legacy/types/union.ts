import pick from 'lodash-es/pick.js'

import {DEFAULT_OVERRIDEABLE_FIELDS, OWN_PROPS_NAME} from './constants'
import {flattenUnionMembers} from './unionUtils'
import {hiddenGetter, lazyGetter} from './utils'

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS, 'of']
const EMPTY_UNION_FIELDS = Object.freeze([])
const warnedUnionFieldsAccesses = new Set<string>()

function getUnionFieldsCallerFrame(stack: string): string {
  const stackFrames = stack
    .split('\n')
    .slice(1)
    .map((line) => line.trim())

  return (
    stackFrames.find((line) => {
      return (
        !line.includes('warnOnUnionFieldsAccess') &&
        !line.includes('getUnionFieldsCallerFrame') &&
        !line.includes('defineUnionFieldsAccessor') &&
        !line.includes('Object.get') &&
        !line.includes('get fields') &&
        !line.includes('legacy/types/union.')
      )
    }) ||
    stackFrames[0] ||
    '<unknown>'
  )
}

function warnOnUnionFieldsAccess(typeName: string) {
  const stack = new Error().stack || ''
  const callerFrame = getUnionFieldsCallerFrame(stack)
  const warningKey = `${typeName}:${callerFrame}`

  if (warnedUnionFieldsAccesses.has(warningKey)) {
    return
  }

  warnedUnionFieldsAccesses.add(warningKey)

  console.warn(
    [
      `Accessed \`fields\` on union schema type "${typeName}".`,
      'Union types do not have stable fields. Use `isUnionSchemaType(type)` and inspect `type.of`, or resolve the selected union member before walking fields.',
      'This compatibility getter returns an empty array so object-shaped schema walkers do not crash.',
    ].join(' ') + (stack ? `\n${stack.replace(/^Error/, 'Stack')}` : ''),
  )
}

function defineUnionFieldsAccessor(type: any) {
  Object.defineProperty(type, 'fields', {
    configurable: false,
    enumerable: false,
    get() {
      warnOnUnionFieldsAccess(type.name)
      return EMPTY_UNION_FIELDS
    },
  })
}

const UNION_CORE = {
  name: 'union',
  type: null,
  jsonType: 'object',
  unionKind: 'object',
  of: [],
  // eslint-disable-next-line camelcase
  __experimental_union: true,
}
defineUnionFieldsAccessor(UNION_CORE)

export const UnionType = {
  get() {
    return UNION_CORE
  },
  extend(subTypeDef: any, createMemberType: any) {
    let memberTypes: any[] | undefined

    function getMemberTypes(): any[] {
      if (!memberTypes) {
        memberTypes = subTypeDef.of.map((ofTypeDef: any) => createMemberType.cached(ofTypeDef))
      }
      return memberTypes!
    }

    const parsed = Object.assign(pick(UNION_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: UNION_CORE,
      jsonType: 'object',
      unionKind: 'object',
      // eslint-disable-next-line camelcase
      __experimental_union: true,
    })
    // Some schema walkers branch on jsonType: 'object' and expect fields to be iterable.
    // Union members live in `of`; this getter returns [] and warns on direct access.
    defineUnionFieldsAccessor(parsed)

    lazyGetter(parsed, 'of', () => {
      return flattenUnionMembers(getMemberTypes())
    })
    lazyGetter(parsed, 'declaredOf', getMemberTypes, {
      enumerable: false,
    })

    lazyGetter(parsed, OWN_PROPS_NAME, () => ({...subTypeDef, of: parsed.of}), {
      enumerable: false,
      writable: false,
    })

    return subtype(parsed)

    function subtype(parent: any) {
      return {
        get() {
          return parent
        },
        extend: (extensionDef: any) => {
          if (extensionDef.of) {
            throw new Error('Cannot override `of` property of subtypes of "union"')
          }

          const ownProps = pick(extensionDef, OVERRIDABLE_FIELDS)
          const current = Object.assign({}, parent, ownProps, {
            type: parent,
          })
          defineUnionFieldsAccessor(current)
          hiddenGetter(current, OWN_PROPS_NAME, ownProps)
          return subtype(current)
        },
      }
    }
  },
}
