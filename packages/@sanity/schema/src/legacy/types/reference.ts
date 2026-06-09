import arrify from 'arrify'
import pick from 'lodash-es/pick.js'

import {DEFAULT_OVERRIDEABLE_FIELDS, OWN_PROPS_NAME} from './constants'
import {createFieldsets} from './object'
import {flattenUnionMembers} from './unionUtils'
import {hiddenGetter, lazyGetter} from './utils'

const REF_FIELD = {
  name: '_ref',
  title: 'Referenced document ID',
  type: 'string',
}

const WEAK_FIELD = {
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
    return 'Reference'
  }
  return `Reference to ${humanize(
    arrify(type.to).map((toType: any) => toType.title),
    'or',
  ).toLowerCase()}`
}

export const ReferenceType = {
  get() {
    return REFERENCE_CORE
  },
  extend(subTypeDef: any, createMemberType: any) {
    if (!subTypeDef.to) {
      throw new Error(
        `Missing "to" field in reference definition. Check the type ${subTypeDef.name}`,
      )
    }
    let targetTypes: any[] | undefined

    function getTargetTypes(): any[] {
      if (!targetTypes) {
        targetTypes = arrify(subTypeDef.to).map((toType: any) => createMemberType(toType))
      }
      return targetTypes!
    }

    const parsed = Object.assign(pick(REFERENCE_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: REFERENCE_CORE,
    })

    lazyGetter(parsed, 'fields', () => {
      return REFERENCE_FIELDS.map((fieldDef) => createMemberType.cachedField(fieldDef))
    })

    lazyGetter(parsed, 'fieldsets', () => {
      return createFieldsets(subTypeDef, parsed.fields)
    })

    lazyGetter(parsed, 'to', () => {
      return flattenUnionMembers(getTargetTypes())
    })

    lazyGetter(parsed, 'declaredTo', getTargetTypes, {
      enumerable: false,
    })

    lazyGetter(parsed, 'title', () => subTypeDef.title || buildTitle(parsed))

    lazyGetter(
      parsed,
      OWN_PROPS_NAME,
      () => ({
        ...subTypeDef,
        fields: parsed.fields,
        fieldsets: parsed.fieldsets,
        to: parsed.to,
        title: parsed.title,
      }),
      {enumerable: false, writable: false},
    )

    return subtype(parsed)

    function subtype(parent: any) {
      return {
        get() {
          return parent
        },
        extend: (extensionDef: any) => {
          if (extensionDef.of) {
            throw new Error('Cannot override `of` of subtypes of "reference"')
          }
          const ownProps = pick(extensionDef, OVERRIDABLE_FIELDS)
          const current = Object.assign({}, parent, ownProps, {
            type: parent,
          })
          hiddenGetter(current, OWN_PROPS_NAME, ownProps)
          return subtype(current)
        },
      }
    }
  },
}
