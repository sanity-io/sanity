import {blocksToEditorValue} from '@sanity/block-tools'
import {Value} from 'slate'
import {SlateValue, Type} from '../typeDefs'

export default function deserialize(value: SlateValue, type: Type) {
  return Value.fromJSON(blocksToEditorValue(value, type))
}
