import {clone, keyBy} from 'lodash'
import {createFieldValue} from '../../state/FormBuilderState'
import {getFieldType} from '../../utils/getFieldType'

export default class ObjectContainer {

  static deserialize(serialized, context) {
    if (!serialized) {
      return new ObjectContainer(serialized, context)
    }
    const {field, schema, resolveContainer} = context
    const type = getFieldType(schema, field)
    const deserialized = {$type: field.type}

    type.fields.forEach(fieldName => {
      if (serialized[fieldName] === void 0) {
        return
      }
      const fieldDef = type.fields[fieldName]
      deserialized[fieldName] = createFieldValue(serialized[fieldName], {field: fieldDef, schema, resolveContainer})
    })
    return new ObjectContainer(deserialized, context)
  }

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
      return ObjectContainer.deserialize(patch.$set, context)
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

  validate() {
    const {field, schema} = this.context

    if (field.required && this.value === void 0) {
      return {errors: [{id: 'required'}]}
    }

    const type = getFieldType(schema, field)

    const fieldValidation = {}

    type.fields.forEach(typeField => {
      const fieldValue = this.getFieldValue(typeField.name)
      console.log('required? %s', typeField.name, typeField.required)
      console.log(typeField.required && fieldValue === void 0)
      if (typeField.required && fieldValue === void 0) {
        fieldValidation[typeField.name] = {errors: [{id: 'required'}]}
        return
      } else if (fieldValue === void 0) {
        return
      }
      fieldValidation[typeField.name] = fieldValue.validate()
    })

    return {
      errors: [],
      fields: fieldValidation
    }
  }

  serialize() {
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
      const fieldVal = this.value[fieldName].serialize()
      if (fieldVal !== void 0) {
        result[fieldName] = fieldVal
      }
    })
    return result
  }
}
