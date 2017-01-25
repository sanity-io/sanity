import guessPreviewConfig from './guessPreviewConfig'

export function canonicalizePreviewConfig(type) {
  return (type.options || {}).preview || guessPreviewConfig(type)
}
