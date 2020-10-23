import {pick} from 'lodash'
import stringify from './JSONStringifyHuman'

const OPTIONS = {
  maxEntries: 2,
  maxDepth: 2,
  maxBreadth: 2,
  ignoreKeys: ['_id', '_type', '_key', '_ref'],
}

export function createFallbackPrepare(fieldNames) {
  return (value) => ({
    title: stringify(pick(value, fieldNames), OPTIONS),
  })
}
