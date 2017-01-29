import {pick, keyBy} from 'lodash'
import {lazyGetter} from './utils'
import guessPreviewConfig from '../preview/guessPreviewConfig'

const INHERITED_FIELDS = ['fields', 'fieldsets']
const OVERRIDABLE_FIELDS = ['jsonType', 'type', 'name', 'title', 'description', 'options']

const OBJECT_CORE = {
  name: 'object',
  title: 'Object',
  type: null,
  jsonType: 'object'
}

function warnIfOldPreviewFormat(type, preview) {
  if (preview && Array.isArray(preview.fields)) {
    // eslint-disable-next-line no-console
    console.warn(
`Heads up! Preview fields must now be an object on the format:
  {property1: 'some.dot.path', property2: 'some.dot.path2'}.
Please check the type definition for "${type.name}" in your schema.
The encountered preview fields was: ${JSON.stringify(preview.fields)}
`)
  }
}

function warnIfPreviewOnOptions(type) {
  if (type.options && type.options.preview) {
    // eslint-disable-next-line no-console
    console.warn(
`Heads up! The preview config is no longer defined on "options", but instead on the type/field itself.
Please move {options: {preview: ...}} to {..., preview: ...} on the type/field definition of "${type.name}".
`)
  }
}

export const ObjectType = {
  get() {
    return OBJECT_CORE
  },
  extend(subTypeDef, createMemberType) {
    const options = {...(subTypeDef.options || {})}
    const parsed = Object.assign(pick(OBJECT_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: OBJECT_CORE,
      options: options,
      fields: subTypeDef.fields.map(fieldDef => {
        const {name, ...rest} = fieldDef
        const compiledField = {name: name}
        return lazyGetter(compiledField, 'type', () => {
          return createMemberType(rest)
        })
      })
    })

    lazyGetter(parsed, 'fieldsets', () => {
      return createFieldsets(subTypeDef, parsed.fields)
    })

    lazyGetter(parsed, 'preview', () => {
      warnIfPreviewOnOptions(subTypeDef)
      const preview = subTypeDef.preview || (subTypeDef.options || {}).preview
      warnIfOldPreviewFormat(preview)
      return preview || guessPreviewConfig(parsed.fields)
    })

    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: extensionDef => {
          if (extensionDef.fields) {
            throw new Error('Cannot override `fields` of subtypes of "object"')
          }
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {type: parent})
          return subtype(current)
        }
      }
    }
  }
}


function createFieldsets(typeDef, fields) {
  const fieldsetsDef = (typeDef.fieldsets || [])
  const fieldsets = fieldsetsDef.map(fieldset => {
    const {name, title, description, options} = fieldset
    return {
      name,
      title,
      description,
      options,
      fields: []
    }
  })

  const fieldsetsByName = keyBy(fieldsets, 'name')

  return fields
    .map(field => {
      if (field.fieldset) {
        const fieldset = fieldsetsByName[field.fieldset]
        if (!fieldset) {
          throw new Error(`Group '${field.fieldset}' is not defined in schema for type '${typeDef.name}'`)
        }
        fieldset.fields.push(field)
        // Return the fieldset if its the first time we encounter a field in this fieldset
        return fieldset.fields.length === 1 ? fieldset : null
      }
      return {single: true, field}
    })
    .filter(Boolean)
}

// const Person = ObjectType.extend({
//   name: 'person',
//   title: 'Person',
//   fields: [
//     {type: 'string', name: 'lol'}
//   ]
// }, v => v)
//
// const TypeOfPerson = Person.extend({
//   name: 'typeofperson',
//   title: 'Type Of Person'
// }, v => v)
//
// const TypeOfTypeOfPerson = TypeOfPerson.extend({
//   name: 'typeoftypeofperson',
//   title: 'Type Of Type Of Person'
// }, v => v)
//
// assert.equal(TypeOfTypeOfPerson.get().type, TypeOfPerson.get())
// assert.equal(TypeOfTypeOfPerson.get().type, TypeOfPerson.get())
// assert.equal(TypeOfTypeOfPerson.get().fields, Person.get().fields)
// assert.throws(
//   () => TypeOfTypeOfPerson.extend({name: 'lol', fields: []}),
//   /Cannot override `fields` of subtypes of "object"/
// )
// // console.log('TypeOfTypeOfPerson', TypeOfTypeOfPerson.get())
//
