import {SchemaType} from './Schema'

export interface DocumentActionUtils {
  isActionEnabled(schema: SchemaType, action: string[]): boolean
  resolveEnabledActions(schema: SchemaType): string[]
}

// We are lazy-loading the part to work around typescript trying to resolve it
export const isActionEnabled = (() => {
  const documentActionUtils = require('part:@sanity/base/util/document-action-utils')
  return (type: SchemaType | undefined, action: string) =>
    type ? documentActionUtils.isActionEnabled(type, action) : false
})()

export const resolveEnabledActions = (() => {
  const documentActionUtils = require('part:@sanity/base/util/document-action-utils')
  return (type: SchemaType) => documentActionUtils.resolveEnabledActions(type)
})()
