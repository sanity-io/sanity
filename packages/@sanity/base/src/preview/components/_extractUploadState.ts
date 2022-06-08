import {UploadState} from '@sanity/types'
import {isRecord, isString} from '../../util'

export function _extractUploadState(value: unknown): {
  _upload?: UploadState
  value: unknown
} {
  if (isRecord(value)) {
    const {_upload, ...restValue} = value

    return {
      _upload: _resolveUploadValue(_upload),
      value: restValue,
    }
  }

  return {_upload: undefined, value}
}

function _resolveUploadValue(value: unknown): UploadState | undefined {
  if (!isRecord(value)) return undefined

  const progress = typeof value.progress === 'number' ? value.progress : undefined
  const initiated = isString(value.initiated) ? value.initiated : undefined
  const updated = isString(value.updated) ? value.updated : undefined
  const fileName = isRecord(value.file) && isString(value.file.name) ? value.file.name : undefined
  const fileType = isRecord(value.file) && isString(value.file.type) ? value.file.type : undefined
  const previewImage = isString(value.previewImage) ? value.previewImage : undefined

  if (progress && initiated && updated && fileName && fileType) {
    return {
      progress,
      initiated,
      updated,
      file: {name: fileName, type: fileType},
      previewImage,
    }
  }

  return undefined
}
