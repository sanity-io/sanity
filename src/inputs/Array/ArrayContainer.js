import {createFieldValue} from '../../state/FormBuilderState'
import {getFieldType} from '../../schema/getFieldType'
import {resolveJSType} from '../../schema/types/utils'
import applyArrayPatch from '../../utils/patching/array'

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

  getFieldDef(typeName) {
    return this.context.field.of.find(ofField => ofField.type === typeName)
  }

  patch(patch) {
    const {context} = this
    const nextValue = applyArrayPatch(this.value, patch, {
      applyItemPatch: (item, itemPatch) => item.patch(itemPatch),
      createItem: item => {
        const fieldDef = this.getFieldDef(item._type)
        return createFieldValue(item, {
          ...context,
          field: fieldDef
        })
      }
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
