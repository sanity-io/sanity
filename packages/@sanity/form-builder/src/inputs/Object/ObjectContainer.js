import {ImmutableAccessor} from '@sanity/mutator'
import {createMemberValue} from '../../state/FormBuilderState'
import hasOwn from '../../utils/hasOwn'

function isEmpty(object) {
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      return false
    }
  }
  return true
}

// Add _type field to values except if they are of type "object"
// (plain objects have their type implicit)
function maybeAddType(object, type) {
  return type.name === 'object' ? object : {
    _type: type.name,
    ...object
  }
}

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

    const serialized = {}

    if (hasOwn(this.value, '_id')) {
      serialized._id = this.value._id
    }

    if (hasOwn(this.value, '_key')) {
      serialized._key = this.value._key
    }

    type.fields.forEach(typeField => {
      const serializedFieldValue = this.value[typeField.name].serialize()
      if (serializedFieldValue !== undefined) {
        serialized[typeField.name] = serializedFieldValue
      }
    })

    return isEmpty(serialized) ? undefined : maybeAddType(serialized, type)
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
    if (key === '_type') {
      if (value !== this.context.type.name) {
        throw new Error(`Type mismatch. Expected ${value} to be ${this.context.type.name}`)
      }
      return this
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
    return ['_key'].concat(this.context.type.fields.map(type => type.name))
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
