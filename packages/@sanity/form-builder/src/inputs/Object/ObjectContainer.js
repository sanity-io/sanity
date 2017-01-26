import {createMemberValue} from '../../state/FormBuilderState'
import {getFieldType} from '../../schema/getFieldType'
import hasOwn from '../../utils/hasOwn'
import {ImmutableAccessor} from '@sanity/mutator'

export default class ObjectContainer {

  static deserialize(serialized = {}, context) {
    const {type, schema, resolveInputComponent} = context
    const deserialized = {_type: type.type}

    if (serialized) {
      if (hasOwn(serialized, '_id')) {
        deserialized._id = serialized._id
      }
      if (hasOwn(serialized, '_key')) {
        deserialized._key = serialized._key
      }
    }

    type.fields.forEach(fieldDef => {
      deserialized[fieldDef.name] = createMemberValue(serialized[fieldDef.name], {
        type: fieldDef.type,
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

  _getFieldDefForFieldName(fieldName) {
    const {type} = this.context
    return type.fields.find(fieldDef => fieldDef.name === fieldName)
  }

  validate() {
    const {type} = this.context

    if (type.required && this.value === undefined) {
      return {
        messages: [{
          id: 'errors.fieldIsRequired',
          type: 'error',
          message: 'Field is required'
        }]
      }
    }

    const fieldValidation = {}

    type.fields.forEach(typeField => {
      const fieldValue = this.getAttribute(typeField.name)
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
    const {type} = this.context

    const serialized = type.fields.reduce((acc, typeField) => {
      const serializedFieldValue = this.value[typeField.name].serialize()
      if (serializedFieldValue !== undefined) {
        acc[typeField.name] = serializedFieldValue
      }
      return acc
    }, {})

    if (hasOwn(this.value, '_id')) {
      serialized._id = this.value._id
    }

    if (hasOwn(this.value, '_key')) {
      serialized._key = this.value._key
    }

    return Object.keys(serialized).length
      ? Object.assign({_type: type.name}, serialized)
      : undefined
  }

  get key() {
    return this.value._key
  }

  toJSON() {
    return this.serialize()
  }

  // Accessor methods
  containerType() {
    return 'object'
  }

  hasAttribute(key) {
    return key === '_key' || !!this._getFieldDefForFieldName(key)
  }

  getAttribute(key) {
    if (key === '_key') {
      return new ImmutableAccessor(this.key)
    }
    if (key === '_id') {
      return new ImmutableAccessor(this.value._id)
    }
    return this.value[key]
  }

  setAttribute(key, value) {
    if (key === '_key') {
      // todo: clean up _key special casing
      return new ObjectContainer(Object.assign({}, this.value, {
        _key: value
      }), this.context)
    }
    const fieldDef = this._getFieldDefForFieldName(key)
    const nextValue = Object.assign({}, this.value, {
      [key]: createMemberValue(value, {
        type: fieldDef.type,
        schema: this.context.schema,
        resolveInputComponent: this.context.resolveInputComponent
      })
    })

    return new ObjectContainer(nextValue, this.context)
  }

  setAttributeAccessor(key, accessor) {
    if (key === '_key' && accessor.get() === undefined) {
      return this
    }
    const nextValue = Object.assign({}, this.value, {
      [key]: accessor
    })
    return new ObjectContainer(nextValue, this.context)
  }

  unsetAttribute(fieldName) {
    return this.setAttribute(fieldName, undefined)
  }

  attributeKeys() {
    return ['_key'].concat(
      getFieldType(this.context.schema, this.context.type).fields.map(type => type.name)
    )
  }

  set(nextValue) {
    return ObjectContainer.deserialize(nextValue, this.context)
  }

  get() {
    return this.serialize()
  }

  isEmpty() {
    const {type} = this.context

    return type.fields.every(typeField => this.getAttribute(typeField.name).isEmpty())
  }

}
