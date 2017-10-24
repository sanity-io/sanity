import {pick} from 'lodash'
import assert from 'assert'
import primitivePreview from '../preview/primitivePreview'

const OVERRIDABLE_FIELDS = ['jsonType', 'type', 'name', 'title', 'description', 'options', 'fieldsets']

const STRING_CORE = {
  name: 'string',
  type: null,
  jsonType: 'string'
}

export const StringType = {
  get() {
    return STRING_CORE
  },
  extend(subTypeDef) {
    const parsed = Object.assign(pick(STRING_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: STRING_CORE,
      preview: primitivePreview
    })

    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: extensionDef => {
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {type: parent})
          return subtype(current)
        }
      }
    }
  }
}
const CustomString = StringType.extend({
  name: 'someStr',
  title: 'Custom String'
})

const TypeOfCustomStr = CustomString.extend({
  name: 'typeOfSomeStr',
  title: 'Type Of CustomString'
}, v => v)

const TypeOfTypeOfCustomStr = TypeOfCustomStr.extend({
  name: 'typeoftypeofcustomstr',
  title: 'Type Of Type Of CustomString'
}, v => v)

assert.equal(TypeOfTypeOfCustomStr.get().type, TypeOfCustomStr.get())
assert.equal(TypeOfTypeOfCustomStr.get().type, TypeOfCustomStr.get())
assert.equal(TypeOfTypeOfCustomStr.get().name, 'typeoftypeofcustomstr')
assert.equal(TypeOfTypeOfCustomStr.get().type.name, 'typeOfSomeStr')
assert.equal(TypeOfTypeOfCustomStr.get().type.type.name, 'someStr')
assert.equal(TypeOfTypeOfCustomStr.get().type.type.type.name, 'string')
assert.equal(TypeOfTypeOfCustomStr.get().type.type.type.jsonType, 'string')
assert.equal(TypeOfTypeOfCustomStr.get().fields, CustomString.get().fields)
