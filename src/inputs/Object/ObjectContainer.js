import {createFieldValue} from '../../state/FormBuilderState'
import {getFieldType} from '../../schema/getFieldType'
import hasOwn from '../../utils/hasOwn'
import applyObjectPatch from '../../utils/patching/object'

export default class ObjectContainer {

  static deserialize(serialized = {}, context) {
    const {field, schema, resolveInputComponent} = context
    const type = getFieldType(schema, field)
    const deserialized = {_type: field.type}

    if (serialized && hasOwn(serialized, '_id')) {
      deserialized._id = serialized._id
    }
    type.fields.forEach(fieldDef => {
      deserialized[fieldDef.name] = createFieldValue(serialized[fieldDef.name], {
        field: fieldDef,
        schema,
        resolveInputComponent
      })
    })
    return new ObjectContainer(deserialized, context)
  }

  constructor(value, context) {
    this.context = context
    this.value = value
  }

  getFieldValue(fieldName) {
    return this.value[fieldName]
  }

  getFieldDefForFieldName(fieldName) {
    const {field, schema} = this.context

    const type = getFieldType(schema, field)
    return type.fields.find(fieldDef => fieldDef.name === fieldName)
  }

  patch(patch) {
    const {context} = this
    const nexValue = applyObjectPatch(this.value, patch, {
      createItem: (item, fieldName) => {
        const fieldDef = this.getFieldDefForFieldName(fieldName)
        return createFieldValue(item, {
          ...context,
          field: fieldDef
        })
      },
      applyItemPatch: (item, itemPatch) => item.patch(itemPatch),
    })
    return new ObjectContainer(nexValue, this.context)
  }

  validate() {
    const {field, schema} = this.context

    if (field.required && this.value === undefined) {
      return {
        messages: [{
          id: 'errors.fieldIsRequired',
          type: 'error',
          message: 'Field is required'
        }]
      }
    }

    const type = getFieldType(schema, field)
    const fieldValidation = {}

    type.fields.forEach(typeField => {
      const fieldValue = this.getFieldValue(typeField.name)
      const validation = fieldValue.validate()
      if (validation) {
        fieldValidation[typeField.name] = validation
      }
    })

    return {
      messages: [],
      fields: fieldValidation
    }
  }

  serialize() {
    const {field, schema} = this.context
    const type = getFieldType(schema, field)

    const serialized = type.fields.reduce((acc, typeField) => {
      const serializedFieldValue = this.getFieldValue(typeField.name).serialize()
      if (serializedFieldValue !== undefined) {
        acc[typeField.name] = serializedFieldValue
      }
      return acc
    }, {})

    if (hasOwn(this.value, '_id')) {
      serialized._id = this.value._id
    }

    return Object.keys(serialized).length
      ? Object.assign({_type: field.type}, serialized)
      : undefined
  }

  isEmpty() {
    const {field, schema} = this.context
    const type = getFieldType(schema, field)

    return type.fields.every(typeField => this.getFieldValue(typeField.name).isEmpty())
  }

  toJSON() {
    return this.serialize()
  }
}
