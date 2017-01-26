import {createMemberValue} from '../../state/FormBuilderState'
import {resolveJSType} from '../../utils/resolveJSType'
import assert from 'assert'

function resolveItemType(item) {
  return (item && item._type) || resolveJSType(item)
}

function wrapItemValue(item, context) {
  const itemTypeName = resolveItemType(item)
  const fieldType = context.type

  // find type in of
  const itemType = fieldType.of.find(ofType => ofType.name === itemTypeName)

  return createMemberValue(item, {
    type: itemType,
    schema: context.schema,
    resolveInputComponent: context.resolveInputComponent
  })
}

export default class ArrayContainer {

  static deserialize(serializedArray, context) {
    if (!serializedArray) {
      return new ArrayContainer([], context)
    }

    const deserialized = serializedArray.map(item => wrapItemValue(item, context))

    return new ArrayContainer(deserialized, context)
  }

  constructor(value, context) {
    this.context = context
    this.value = value
  }

  byKey(key) {
    return this.value.find(val => val.key === key)
  }

  at(index) {
    return this.getIndex(index)
  }

  indexOf(value) {
    return this.value.indexOf(value)
  }

  map(mapFn) {
    return this.value && this.value.map(mapFn)
  }

  validate() {
    const {type} = this.context

    const result = {
      messages: [],
      items: []
    }

    if (type.required && this.value.length === 0) {
      result.messages.push({
        id: 'errors.fieldIsRequired',
        type: 'error',
        message: 'Field needs at least one entry'
      })
    }

    result.items = this.map(item => item.validate())
    return result
  }

  toJSON() {
    return this.serialize()
  }

  serialize() {
    if (this.value.length === 0) {
      return undefined
    }
    return this.map(item => {
      const itemVal = item.serialize()
      if (item.containerType() === 'object' && item.key) {
        return Object.assign({}, itemVal, {_key: item.key})
      }
      return itemVal
    })
  }

  isEmpty() {
    return this.value.every(item => item.isEmpty())
  }

  // Accessor methods
  containerType() {
    return 'array'
  }

  setIndex(index, item) {
    const nextValue = this.value.slice()
    nextValue[index] = wrapItemValue(item, this.context)
    return new ArrayContainer(nextValue, this.context)
  }

  setIndexAccessor(index, accessor) {
    const nextValue = this.value.slice()
    nextValue[index] = accessor
    return new ArrayContainer(nextValue, this.context)
  }

  unsetIndices(indices) {
    if (indices.length === 0) {
      return this
    }
    const nextValue = this.value.filter((_ignore, index) => !indices.includes(index))
    return new ArrayContainer(nextValue, this.context)
  }

  insertItemsAt(pos, items) {
    const {value, context} = this
    assert(pos >= 0 && pos <= value.length, `Array position "${pos}" is out of bounds: [0, ${value.length}]`)

    const wrappedItems = items.map(item => wrapItemValue(item, context))

    if (value.length === 0) {
      return new ArrayContainer(wrappedItems, context)
    }

    return new ArrayContainer(value.slice(0, pos).concat(wrappedItems).concat(value.slice(pos)), context)
  }

  length() {
    return this.value.length
  }

  getIndex(index) {
    return this.value[index]
  }

  set(nextValue) {
    return ArrayContainer.deserialize(nextValue, this.context)
  }

  get() {
    return this.serialize()
  }

}
