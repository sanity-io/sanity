import {get} from 'lodash'
import createPreview from './createPreview'
import observePaths from './observePaths'

const pass = v => v

const observe = createPreview(observePaths)

export default function observeForPreview(value, type) {
  const fields = type.preview.fields
  const targetKeys = Object.keys(fields)
  const paths = targetKeys.map(key => fields[key].split('.'))

  return observe(value, paths)
    .map(result => {
      return targetKeys.reduce((acc, key) => {
        acc[key] = get(result, fields[key])
        return acc
      }, {})
    })
    .map(type.preview.prepare || pass)
}
