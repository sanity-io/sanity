import {UploadState} from '@sanity/types'
import {isRecord, isString} from '../../util'

export function _extractUploadState(value: any): UploadState | undefined {
  return _resolveUploadValue(value?._upload)
}

function getStringOrUndefined(value: unknown): string | undefined {
  return isString(value) ? value : undefined
}
function _resolveUploadValue(value: unknown): UploadState | undefined {
  if (!isRecord(value)) return undefined

  const progress = typeof value.progress === 'number' ? value.progress : 0
  const createdAt = getStringOrUndefined(value.initiated || value.createdAt)
  const updatedAt = getStringOrUndefined(value.updated || value.updatedAt)
  const fileName = getStringOrUndefined((value?.file as any)?.name)
  const fileType = getStringOrUndefined((value?.file as any)?.type)
  const previewImage = getStringOrUndefined(value.previewImage)

  if (createdAt && updatedAt && fileName && fileType) {
    return {
      progress,
      createdAt,
      updatedAt,
      file: {name: fileName, type: fileType},
      previewImage,
    }
  }

  return undefined
}
