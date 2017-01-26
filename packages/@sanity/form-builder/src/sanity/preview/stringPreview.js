import {prepareValue} from './utils'

export default function stringPreview(value, type) {
  const previewConfig = type.options.preview

  return prepareValue(value, previewConfig).title
}
