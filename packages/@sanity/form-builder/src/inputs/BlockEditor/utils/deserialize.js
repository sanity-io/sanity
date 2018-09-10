// @flow
import type {SlateValue, Type} from '../typeDefs'

import {blocksToEditorValue} from '@sanity/block-tools'
import {Value} from 'slate'

export default function deserialize(value: SlateValue, type: Type) {
  return Value.fromJSON(blocksToEditorValue(value, type))
}
