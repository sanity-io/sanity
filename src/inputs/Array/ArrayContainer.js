import {createFieldValue} from '../../state/FormBuilderState'
import {getFieldType} from '../../schema/getFieldType'
import {resolveJSType} from '../../schema/types/utils'
import hasOwn from '../../utils/hasOwn'

function move(arr, from, to) {
  const nextValue = arr.slice()
  const val = nextValue[from]
  nextValue.splice(from, 1)
  nextValue.splice(to, 0, val)
  return nextValue
}

const SUPPORTED_PATCH_TYPES = ['append', 'prepend', 'unset', 'set']

export default class ArrayContainer {

  static deserialize(serializedArray, context) {
    if (!serializedArray) {
      return new ArrayContainer([], context)
    }

    const {field, schema, resolveInputComponent} = context

    const type = getFieldType(schema, field)

    const deserialized = serializedArray.map(item => {
      const itemType = (item && item._type) || resolveJSType(item)

      // find type in of
      const fieldDef = type.of.find(ofType => ofType.type === itemType)

      return createFieldValue(item, {field: fieldDef, schema, resolveInputComponent})
    })
    return new ArrayContainer(deserialized, context)
  }

  get length() {
    return this.value.length
  }

  constructor(value, context) {
    this.context = context
    this.value = value
  }

  at(index) {
    return this.value[index]
  }

  indexOf(value) {
    return this.value.indexOf(value)
  }

  map(mapFn) {
    return this.value && this.value.map(mapFn)
  }

  validate() {
    const {field} = this.context

    const result = {
      messages: [],
      items: []
    }

    if (field.required && this.value.length === 0) {
      result.messages.push({
        id: 'errors.fieldIsRequired',
        type: 'error',
        message: 'Field needs at least one entry'
      })
    }

    result.items = this.map(item => item.validate())
    return result
  }

  patch(patch) {
    const nextValue = this.value ? this.value.slice() : [] // make a copy for internal mutation

    if (patch.path.length === 0) {
      // its directed to me
      if (patch.type === 'set') {
        if (!Array.isArray(patch.value)) { // eslint-disable-line max-depth
          throw new Error('Cannot set value of an array to a non-array')
        }
        return ArrayContainer.deserialize(patch.value, this.context)
      } else if (patch.type === 'prepend') {
        return new ArrayContainer([patch.value, ...nextValue], this.context)
      } else if (patch.type === 'append') {
        return new ArrayContainer([...nextValue, patch.value], this.context)
      } else if (patch.type === 'unset') {
        return ArrayContainer.deserialize(undefined, this.context)
      } else if (patch.type === 'move') {
        if (!patch.value || !hasOwn(patch.value, 'from') || !hasOwn(patch.value, 'to')) { // eslint-disable-line max-depth
          throw new Error(`Invalid value of 'move' patch. Expected a value with "from" and "to" indexes, instead got: ${JSON.stringify(patch.value)}`)
        }
        return new ArrayContainer(move(nextValue), this.context)
      }
      throw new Error(`Invalid array operation: ${patch.type}`)
    }

    if (patch.path.length === 1 && patch.type === 'unset') {
      const index = patch.path[0]
      if (typeof index !== 'number') {
        throw new Error(`Expected array index to be a number, instead got "${index}"`)
      }
      nextValue.splice(index, 1)
      return new ArrayContainer(nextValue, this.context)
    }

    // The patch is not directed to me
    const [index, ...rest] = patch.path
    if (typeof index !== 'number') {
      throw new Error(`Expected array index to be a number, instead got "${index}"`)
    }
    nextValue[index] = nextValue[index].patch({
      ...patch,
      path: rest
    })
    return new ArrayContainer(nextValue, this.context)
  }

  serialize() {
    return this.value.length === 0
      ? undefined
      : this.map(val => val.serialize())
  }

  isEmpty() {
    return this.value.every(value => value.isEmpty())
  }

  toJSON() {
    return this.serialize()
  }
}
