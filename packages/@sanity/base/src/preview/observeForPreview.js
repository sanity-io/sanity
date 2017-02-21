import createPreview from './createPreview'
import observePaths from './observePaths'

const observe = createPreview(observePaths)

export default function observeForPreview(value, type) {
  const selection = type.preview.select
  const targetKeys = Object.keys(selection)
  const paths = targetKeys.map(key => selection[key].split('.'))

  return observe(value, paths)
}
