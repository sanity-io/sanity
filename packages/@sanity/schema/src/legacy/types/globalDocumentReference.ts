import arrify from 'arrify'
import {pick} from 'lodash'

import {DEFAULT_OVERRIDEABLE_FIELDS} from './constants'
import {lazyGetter} from './utils'

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

const GLOBAL_DOCUMENT_REFERENCE_CORE = {
  name: 'globalDocumentReference',
  title: 'Global Document Reference',
  type: null,
  jsonType: 'object',
}

function humanize(arr: any, conjunction: any) {
  const len = arr.length
  if (len === 1) {
    return arr[0]
  }
  const first = arr.slice(0, len - 1)
  const last = arr[len - 1]
  return `${first.join(', ')} ${conjunction} ${last}`
}

function buildTitle(type: any) {
  if (!type.to || type.to.length === 0) {
    return 'Global Document Reference'
  }
  return `Global Document Reference to ${humanize(
    arrify(type.to).map((toType: any) => toType.title),
    'or',
  ).toLowerCase()}`
}

export const GlobalDocumentReferenceType = {
  get() {
    return GLOBAL_DOCUMENT_REFERENCE_CORE
  },
  extend(subTypeDef: any, createMemberType: any) {
    if (!subTypeDef.to) {
      throw new Error(
        `Missing "to" field in global document reference definition. Check the type ${subTypeDef.name}`,
      )
    }
    const parsed = Object.assign(
      pick(GLOBAL_DOCUMENT_REFERENCE_CORE, OVERRIDABLE_FIELDS),
      subTypeDef,
      {
        type: GLOBAL_DOCUMENT_REFERENCE_CORE,
      },
    )

    lazyGetter(parsed, 'fields', () => {
      return REFERENCE_FIELDS.map((fieldDef) => {
        const {name, ...type} = fieldDef
        return {
          name: name,
          type: createMemberType(type),
        }
      })
    })

    lazyGetter(parsed, 'to', () => {
      return arrify(subTypeDef.to).map((toType: any) => {
        return {
          ...toType,
        }
      })
    })

    lazyGetter(parsed, 'title', () => subTypeDef.title || buildTitle(parsed))

    return subtype(parsed)

    function subtype(parent: any) {
      return {
        get() {
          return parent
        },
        extend: (extensionDef: any) => {
          if (extensionDef.of) {
            throw new Error('Cannot override `of` of subtypes of "globalDocumentReference"')
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
