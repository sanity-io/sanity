import {clone, keyBy} from 'lodash'
import {createFieldValue} from '../../state/FormBuilderState'
import {getFieldType} from '../../schema/getFieldType'

const hasOwn = (() => {
  const hO = {}.hasOwnProperty
  return (obj, ...args) => hO.call(obj, ...args)
})()

export default class ObjectContainer {

  static deserialize(serialized = {}, context) {
    const {field, schema, resolveInputComponent} = context
    const type = getFieldType(schema, field)
    const deserialized = {_type: field.type}

    if (serialized && hasOwn(serialized, '_id')) {
      deserialized._id = serialized._id
    }
    type.fields.forEach(fieldDef => {
      deserialized[fieldDef.name] = createFieldValue(serialized[fieldDef.name], {field: fieldDef, schema, resolveInputComponent})
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

  patch(patch) {
    const {value, context} = this
    const {field, schema, resolveInputComponent} = context

    const type = getFieldType(schema, field)
    const newVal = value ? clone(value) : {_type: type.name}

    if (patch.hasOwnProperty('$set')) {
      return ObjectContainer.deserialize(patch.$set, context)
    }

    const keyedFields = keyBy(type.fields, 'name')

    Object.keys(patch).forEach(keyName => {
      if (!keyedFields.hasOwnProperty(keyName)) {
        throw new Error(`Type ${type.name} has no field named ${keyName}`)
      }

      const fieldDef = keyedFields[keyName]

      if (!newVal.hasOwnProperty(keyName)) {
        newVal[keyName] = createFieldValue(undefined, {field: fieldDef, schema: context.schema, resolveInputComponent})
      }
      newVal[keyName] = newVal[keyName].patch(patch[keyName])
    })
    return new ObjectContainer(newVal, context)
  }

  validate() {
    const {field, schema} = this.context

    if (field.required && this.value === undefined) {
      return {messages: [{
        id: 'errors.fieldIsRequired',
        type: 'error',
        message: 'Field is required'
      }]}
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
