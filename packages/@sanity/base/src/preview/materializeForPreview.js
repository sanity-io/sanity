import {get} from 'lodash'
import createPreviewMaterializer from './createPreviewMaterializer'
import fetchWithPaths from './fetchWithPaths'

const pass = v => v

const materialize = createPreviewMaterializer(fetchWithPaths)

export default function materializeForPreview(value, type) {
  const fields = type.preview.fields
  const targetKeys = Object.keys(fields)
  const paths = targetKeys.map(key => fields[key].split('.'))
  return Promise.resolve(materialize(value, paths))
    .then(result => {
      return targetKeys.reduce((acc, key) => {
        acc[key] = get(result, fields[key])
        return acc
      }, {})
    })
    .then(type.preview.prepare || pass)
}
