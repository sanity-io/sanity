import {pick, omit} from 'lodash'
import assert from 'assert'
import arrify from 'arrify'
import {lazyGetter} from './utils'

const OVERRIDABLE_FIELDS = ['jsonType', 'type', 'name', 'title', 'description', 'options']

const REFERENCE_CORE = {
  name: 'reference',
  type: null,
  jsonType: 'object'
}

export const ReferenceType = {
  get() {
    return REFERENCE_CORE
  },
  extend(subTypeDef, createMemberType) {
    if (!subTypeDef.to) {
      throw new Error(`Missing "to" field in reference definition. Check the type ${subTypeDef.name}`)
    }
    const parsed = Object.assign(pick(REFERENCE_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: REFERENCE_CORE,
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
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {type: parent})
          return subtype(current)
        }
      }
    }
  }
}

const CustomRef = ReferenceType.extend({
  name: 'customRef',
  title: 'Custom ref',
  to: []
})

const TypeOfCustomStr = CustomRef.extend({
  name: 'typeOfCustomRef',
  title: 'Type Of CustomRef'
})

const TypeOfTypeOfCustomStr = TypeOfCustomStr.extend({
  name: 'typeOfTypeOfCustomRef',
  title: 'Type Of Type Of CustomRef'
})

assert.equal(TypeOfTypeOfCustomStr.get().type, TypeOfCustomStr.get())
assert.equal(TypeOfTypeOfCustomStr.get().type, TypeOfCustomStr.get())
assert.equal(TypeOfTypeOfCustomStr.get().name, 'typeOfTypeOfCustomRef')
assert.equal(TypeOfTypeOfCustomStr.get().type.name, 'typeOfCustomRef')
assert.equal(TypeOfTypeOfCustomStr.get().type.type.name, 'customRef')
assert.equal(TypeOfTypeOfCustomStr.get().type.type.type.name, 'reference')
assert.equal(TypeOfTypeOfCustomStr.get().type.type.type.jsonType, 'object')
assert.equal(TypeOfTypeOfCustomStr.get().to, CustomRef.get().to)
