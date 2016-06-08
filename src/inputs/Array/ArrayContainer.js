import {createFieldValue} from '../../state/FormBuilderState'
import {getFieldType} from '../../utils/getFieldType'
import {resolveJSType} from '../../types/utils'

export default class ArrayContainer {

  static deserialize(serializedArray, context) {
    if (!serializedArray) {
      return new ArrayContainer(serializedArray, context)
    }
    const {field, schema, resolveContainer} = context

    const type = getFieldType(schema, field)

    const deserialized = serializedArray.map(item => {

      const itemType = (item && item.$type) || resolveJSType(item)
      // find type in of

      const fieldDef = type.of.find(ofType => ofType.type === itemType)

      return createFieldValue(item, {field: fieldDef, schema, resolveContainer})
    })
    return new ArrayContainer(deserialized, context)
  }

  constructor(value, context) {
    this.context = context
    this.value = value
  }

  map(mapFn) {
    return this.value.map(mapFn)
  }

  patch(patch) {
    const {value, context} = this

    if (patch.hasOwnProperty('$set')) {
      return ArrayContainer.wrap(patch.$set, context)
    }

    const nextVal = (value || []).concat()

    if (patch.hasOwnProperty('$unshift')) {
      patch.$unshift.forEach(item => {
        nextVal.unshift(item)
      })
      return new ArrayContainer(nextVal, context)
    }

    Object.keys(patch).forEach(index => {
      if (isNaN(index)) {
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
    return this.value.map(val => val.serialize())
  }
}
