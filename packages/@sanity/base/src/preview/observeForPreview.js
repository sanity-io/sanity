import {get} from 'lodash'
import createPreview from './createPreview'
import observePaths from './observePaths'

const pass = v => v

const observe = createPreview(observePaths)

export default function observeForPreview(value, type) {
  const selection = type.preview.select
  const targetKeys = Object.keys(selection)
  const paths = targetKeys.map(key => selection[key].split('.'))

  return observe(value, paths)
    .map(result => {
      return targetKeys.reduce((acc, key) => {
        acc[key] = get(result, selection[key])
        return acc
      }, {})
    })
    .map(type.preview.prepare || pass)
}
