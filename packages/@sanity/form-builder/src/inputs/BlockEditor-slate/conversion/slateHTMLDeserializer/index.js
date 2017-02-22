import * as rules from './rules'
import {Html} from 'slate'

export default function deserialize(html, createFieldValueFn) {
  const deserializer = new Html({
    rules: rules.createRules(createFieldValueFn),
    defaultBlockType: rules.defaultBlockType
  })
  const {document} = deserializer.deserialize(html)
  return document
}
