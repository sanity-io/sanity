import {canonicalizePreviewConfig, prepareValue} from './utils'

export default function stringPreview(value, field) {
  const previewConfig = canonicalizePreviewConfig(field)

  return prepareValue(value, previewConfig).title
}
