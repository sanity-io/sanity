// const {schemaTypeName: sourceSchemaTypeName, isDocument, isArray} = value

import {normalizeBlock} from '@sanity/block-tools'
import {pickBy} from 'lodash'
import {type SchemaType} from 'sanity'

import {type CopyActionResult} from './types'

export interface TransferValueOptions {
  targetSchemaType: SchemaType
  targetDocumentType?: string
}

export function transferValue(
  value: CopyActionResult,
  {targetDocumentType, targetSchemaType}: TransferValueOptions,
): CopyActionResult {
  const {schemaTypeName: sourceSchemaTypeName, isDocument, isArray} = value
  const keysToDelete = ['_id', '_type', '_createdAt', '_updatedAt', '_rev']
  const isArrayValue = Array.isArray(value.docValue)
  const isPrimitiveValue = typeof value.docValue !== 'object'

  let targetValue =
    isArrayValue || isPrimitiveValue
      ? value.docValue
      : pickBy(
          value.docValue as object,
          (_value, key) => !keysToDelete.includes(key) && !key.startsWith('_'),
        )
  const isTargetDocument = targetSchemaType.type?.name === 'document'
  const targetName = targetSchemaType.name
  const targetTypeLabel = isTargetDocument ? 'document' : 'field'

  if (isArrayValue || isArray) {
    // Reset/normalize array object keys
    targetValue = [...targetValue].map((item) => {
      return normalizeBlock(item)
    })
  }
  if (isDocument && (!isTargetDocument || targetDocumentType !== sourceSchemaTypeName)) {
    throw new Error(
      `Cannot paste document of type ${sourceSchemaTypeName} into ${targetTypeLabel} of type ${targetName}`,
    )
  }
  return targetValue
}
