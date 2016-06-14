import {createFieldValue} from '../../state/FormBuilderState'
import {getFieldType} from '../../utils/getFieldType'
import {resolveJSType} from '../../types/utils'

export default class ArrayContainer {

  static deserialize(serializedArray, context) {
    if (!serializedArray) {
      return new ArrayContainer([], context)
    }

    const {field, schema, resolveInputComponent} = context

    const type = getFieldType(schema, field)

    const deserialized = serializedArray.map(item => {
      const itemType = (item && item.$type) || resolveJSType(item)

      // find type in of
      const fieldDef = type.of.find(ofType => ofType.type === itemType)

      return createFieldValue(item, {field: fieldDef, schema, resolveInputComponent})
    })
    return new ArrayContainer(deserialized, context)
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
    const {value, context} = this

    if (patch.hasOwnProperty('$set')) {
      return ArrayContainer.deserialize(patch.$set, context)
    }

    const nextVal = (value || []).concat()

    if (patch.hasOwnProperty('$unshift')) {
      patch.$unshift.forEach(item => nextVal.unshift(item))
      return new ArrayContainer(nextVal, context)
    }

    if (patch.hasOwnProperty('$splice')) {
      patch.$splice.forEach(args => nextVal.splice(...args))
      return new ArrayContainer(nextVal, context)
    }

    Object.keys(patch).forEach(index => {
      if (isNaN(index)) {
        if (String(index).startsWith('$')) {
          throw new Error(`Method "${index}" not (yet) supported for arrays`)
        }

        throw new Error(`When patching array elements, the indices must be numbers, got ${index}`)
      }

      if (!nextVal.hasOwnProperty(index)) {
        throw new Error(`No such index ${index} on array`)
      }

      nextVal[index] = nextVal[index].patch(patch[index])
    })

    return new ArrayContainer(nextVal, context)
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
