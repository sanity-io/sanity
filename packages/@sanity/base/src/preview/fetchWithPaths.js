import client from 'part:@sanity/base/client'
import {set} from 'lodash'

export default function fetchWithPaths(id, paths) {
  const labeledFields = paths.map((path, i) => `"_f_${i}": ${path.join('.')}`)
  return client.fetch(`*[_id==$id]{_id,_type,${labeledFields.join(',')}}`, {id})
    .then(result => result[0])
    .then(result => {
      const {_id, _type, ...labels} = result
      const res = {_id, _type}
      Object.keys(labels).forEach((label, i) => {
        set(res, paths[i], labels[`_f_${i}`])
      })
      return res
    })
}
