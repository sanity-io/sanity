import {Md5} from 'ts-md5'
import type {SearchFieldDefinition} from '../types'

export function generateFieldId(field: SearchFieldDefinition): string {
  return Md5.hashStr(
    JSON.stringify([field.documentTypes, field.fieldPath, field.filterName, field.type])
  )
}
