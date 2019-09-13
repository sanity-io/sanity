import {List} from 'immutable'
import {SlateOperation} from '../typeDefs'

const IS_WRITING_TEXT_OPERATION_TYPES = ['insert_text', 'remove_text']

export default function isWritingTextOperationsOnly(operations: List<SlateOperation>) {
  return operations
    .map(op => op.type)
    .every(opType => IS_WRITING_TEXT_OPERATION_TYPES.includes(opType))
}
