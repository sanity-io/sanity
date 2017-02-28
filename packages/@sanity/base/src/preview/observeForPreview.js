import createPreviewObserver from './createPreviewObserver'
import observeWithPaths from './observeWithPaths'

const observe = createPreviewObserver(observeWithPaths)

export default function observeForPreview(value, type) {
  const selection = type.preview.select
  const targetKeys = Object.keys(selection)
  const paths = targetKeys.map(key => selection[key].split('.'))

  return observe(value, paths)
}
