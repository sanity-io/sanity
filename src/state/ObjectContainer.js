import {createFieldValue} from './FormBuilderState'
import {clone, keyBy} from 'lodash'
import {getFieldType} from '../utils/getFieldType'

export default class ObjectContainer {
  constructor(value, context) {
    this.context = context
    this.value = value
  }

  getFieldValue(fieldName) {
    return this.value ? this.value[fieldName] : void 0
  }

  patch(patch) {
    const {value, context} = this
    const {field, schema, resolveContainer} = context

    const type = getFieldType(schema, field)
    const newVal = value ? clone(value) : {$type: type.name}

    if (patch.hasOwnProperty('$set')) {
      return ObjectContainer.wrap(patch.$set, context)
    }

    const keyedFields = keyBy(type.fields, 'name')

    Object.keys(patch).forEach(keyName => {
      if (!keyedFields.hasOwnProperty(keyName)) {
        throw new Error(`Type ${type.name} has no field named ${keyName}`)
      }

      const fieldDef = keyedFields[keyName]

      if (!newVal.hasOwnProperty(keyName)) {
        newVal[keyName] = createFieldValue(void 0, {field: fieldDef, schema: context.schema, resolveContainer})
      }
      newVal[keyName] = newVal[keyName].patch(patch[keyName])
    })
    return new ObjectContainer(newVal, context)
  }

  unwrap() {
    if (!this.value) {
      return this.value
    }
    const result = Object.assign(Object.create(null), {
      $type: this.context.field.type
    })

    Object.keys(this.value).forEach(fieldName => {
      if (fieldName === '$type') {
        return
      }
      const fieldVal = this.value[fieldName].unwrap()
      if (fieldVal !== void 0) {
        result[fieldName] = fieldVal
      }
    })
    return result
  }
}

ObjectContainer.wrap = function wrap(value, context) {
  if (!value) {
    return new ObjectContainer(value, context)
  }
  const {field, schema, resolveContainer} = context
  const type = getFieldType(schema, field)
  const wrappedValue = {$type: field.type}

  type.fields.forEach(fieldName => {
    if (value[fieldName] === void 0) {
      return
    }
    const fieldDef = type.fields[fieldName]
    wrappedValue[fieldName] = createFieldValue(value[fieldName], {field: fieldDef, schema, resolveContainer})
  })
  return new ObjectContainer(wrappedValue, context)
}

