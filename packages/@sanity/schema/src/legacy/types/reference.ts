import arrify from 'arrify'
import {pick} from 'lodash'
import {lazyGetter} from './utils'
import {DEFAULT_OVERRIDEABLE_FIELDS} from './constants'
import {createFieldsets} from './object'

export const REF_FIELD = {
  name: '_ref',
  title: 'Referenced document ID',
  type: 'string',
}

export const WEAK_FIELD = {
  name: '_weak',
  title: 'Weak reference',
  type: 'boolean',
}

const REFERENCE_FIELDS = [REF_FIELD, WEAK_FIELD]

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS]

const REFERENCE_CORE = {
  name: 'reference',
  title: 'Reference',
  type: null,
  jsonType: 'object',
}

function humanize(arr, conjunction) {
  const len = arr.length
  if (len === 1) {
    return arr[0]
  }
  const first = arr.slice(0, len - 1)
  const last = arr[len - 1]
  return `${first.join(', ')} ${conjunction} ${last}`
}

function buildTitle(type) {
  if (!type.to || type.to.length === 0) {
    return 'Reference'
  }
  return `Reference to ${humanize(
    arrify(type.to).map((toType) => toType.title),
    'or'
  ).toLowerCase()}`
}

export const ReferenceType = {
  get() {
    return REFERENCE_CORE
  },
  extend(subTypeDef, createMemberType) {
    if (!subTypeDef.to) {
      throw new Error(
        `Missing "to" field in reference definition. Check the type ${subTypeDef.name}`
      )
    }
    const parsed = Object.assign(pick(REFERENCE_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: REFERENCE_CORE,
    })

    lazyGetter(parsed, 'fields', () => {
      return REFERENCE_FIELDS.map((fieldDef) => {
        const {name, ...type} = fieldDef
        return {
          name: name,
          type: createMemberType(type),
        }
      })
    })

    lazyGetter(parsed, 'fieldsets', () => {
      return createFieldsets(subTypeDef, parsed.fields)
    })

    lazyGetter(parsed, 'to', () => {
      return arrify(subTypeDef.to).map((toType) => createMemberType(toType))
    })

    lazyGetter(parsed, 'title', () => subTypeDef.title || buildTitle(parsed))

    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: (extensionDef) => {
          if (extensionDef.of) {
            throw new Error('Cannot override `of` of subtypes of "reference"')
          }
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {
            type: parent,
          })
          return subtype(current)
        },
      }
    }
  },
}
