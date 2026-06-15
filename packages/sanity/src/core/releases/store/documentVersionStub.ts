import {type VersionInfoDocumentStub} from './types'

export const DOCUMENT_STUB_PATHS = [
  '_id',
  '_type',
  '_rev',
  '_createdAt',
  '_updatedAt',
  '_system',
] as const

export function isExistingVersionStub(value: unknown): value is VersionInfoDocumentStub {
  return Boolean(
    value &&
    typeof value === 'object' &&
    '_rev' in value &&
    typeof (value as VersionInfoDocumentStub)._rev === 'string' &&
    (value as VersionInfoDocumentStub)._rev,
  )
}

export function toVersionInfoDocumentStub(value: unknown): VersionInfoDocumentStub | undefined {
  return isExistingVersionStub(value) ? value : undefined
}
