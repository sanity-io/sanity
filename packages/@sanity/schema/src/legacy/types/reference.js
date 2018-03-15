import {pick} from 'lodash'
import arrify from 'arrify'
import {lazyGetter} from './utils'

const OVERRIDABLE_FIELDS = ['jsonType', 'type', 'name', 'title', 'description', 'options']

const REFERENCE_CORE = {
  name: 'reference',
  type: null,
  jsonType: 'object'
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
  if (type.title) {
    return type.title
  }
  if (!type.to || type.to.length === 0) {
    return 'Reference'
  }
  return `Reference to ${humanize(
    arrify(type.to).map(toType => (toType.title || toType.name || toType.type || '').toLowerCase()),
    'or'
  )}`
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
      title: subTypeDef.title || buildTitle(subTypeDef)
    })

    lazyGetter(parsed, 'to', () => {
      return arrify(subTypeDef.to).map(toType => createMemberType(toType))
    })

    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: extensionDef => {
          if (extensionDef.of) {
            throw new Error('Cannot override `of` of subtypes of "reference"')
          }
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {
            type: parent
          })
          return subtype(current)
        }
      }
    }
  }
}
