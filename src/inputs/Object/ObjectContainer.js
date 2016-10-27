import {clone, isObject} from 'lodash'
import {createFieldValue} from '../../state/FormBuilderState'
import {getFieldType} from '../../schema/getFieldType'
import hasOwn from '../../utils/hasOwn'

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

    const type = getFieldType(context.schema, context.field)
    const nextValue = this.value ? clone(this.value) : {_type: type.name}
    if (patch.path.length === 0) {
      // its directed to me
      if (patch.type === 'set') {
        if (!isObject(patch.value)) { // eslint-disable-line max-depth
          throw new Error('Cannot set value of an object to a non-object')
        }
        return ObjectContainer.deserialize(patch.value, this.context)
      } else if (patch.type === 'unset') {
        return ObjectContainer.deserialize(undefined, this.context)
      } else if (patch.type === 'merge') {
        // Turn into a 'set' with paths
        if (!isObject(patch.value)) { // eslint-disable-line max-depth
          throw new Error('Non-object argument used with the "merge" patch type.')
        }
        const toMerge = Object.keys(patch.value).reduce((acc, fieldName) => {
          const fieldDef = this.getFieldDefForFieldName(fieldName)
          acc[fieldName] = createFieldValue(patch.value[fieldName], {
            ...context,
            field: fieldDef
          })
          return acc
        }, {})
        return new ObjectContainer(Object.assign(nextValue, toMerge), context)
      }
      throw new Error(`Invalid object operation: ${patch.type}`)
    }

    // The patch is not directed to me
    const [fieldName, ...rest] = patch.path
    if (typeof fieldName !== 'string') {
      throw new Error(`Expected field name to be a string, instad got: ${fieldName}`)
    }
    nextValue[fieldName] = nextValue[fieldName].patch({
      ...patch,
      path: rest
    })
    return new ObjectContainer(nextValue, this.context)
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
