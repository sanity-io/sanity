const {pick, omit} = require('lodash')

const OVERRIDABLE_FIELDS = ['name', 'title', 'description', 'options']
const OBJECT_TYPE = {
  name: 'object',
  title: 'Object',
  type: null,
}
const ObjectType = {
  get() {
    return OBJECT_TYPE
  },
  extend(subTypeDef, extendMember) {
    const parsed = Object.assign({}, subTypeDef, {
      type: OBJECT_TYPE,
      fields: subTypeDef.fields.map(fieldDef => {
        return {
          name: fieldDef.name,
          type: extendMember(omit(fieldDef, 'name'))
        }
      })
    })
    return {
      get() {
        return parsed
      },
      extend(extensionDef, extendMember) {
        if (extensionDef.fields) {
          throw new Error('Cannot override `fields` of subtypes of "object"')
        }
        return ObjectType.extend(Object.assign(pick(extensionDef, OVERRIDABLE_FIELDS), {
          type: this.get(),
          fields: parsed.fields
        }), extendMember)
      }
    }
  }
}

const Inline = ObjectType.extend({
  title: 'LOL INLINE',
  fields: [
    {type: 'string', name: 'lol'}
  ]
}, v => v)

console.log(Inline.get())

const person = ObjectType.extend({
  name: 'person',
  fields: [
    {type: 'string', name: 'lol'}
  ]
}, v => v)

const TypeOfPerson = person.extend({
  name: '<anonymous>',
  title: 'Foo'
}, v => v)

// console.log(person.get())
console.log('TypeOfPerson', TypeOfPerson.get())
