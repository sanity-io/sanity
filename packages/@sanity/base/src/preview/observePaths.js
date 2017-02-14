import client from 'part:@sanity/base/client'
import Observable from '@sanity/observable'
import {set} from 'lodash'

// Todo: figure out a way to do optimistic updates
// const ALWAYS_INCLUDE = ['_id', '_type']
// export default function observePaths(id, paths) {
//   return client.listen(query, params)
//     .subscribe(comment => {
//       console.log(`${comment.author} commented: ${comment.text}`)
//     })
// }

function fetchDocumentSnapshot(query, params) {
  return client.fetch(query, params)
    .then(result => result[0])
}

export default function observePaths(id, paths) {
  const labeledFields = paths.map((path, i) => `"_f_${i}": ${path.join('.')}`)
  const query = `*[_id==$id]{_id,_type,${labeledFields.join(',')}}`
  return Observable.from(client.listen(query, {id}, {includeDocuments: true, events: ['welcome', 'change']}))
    .concatMap(event => {
      if (event.type === 'welcome') {
        return fetchDocumentSnapshot(query, {id})
      }
      return event.documents[0]
    })
    .map(result => {
      const {_id, _type, ...labels} = result
      const res = {_id, _type}
      Object.keys(labels).forEach((label, i) => {
        set(res, paths[i], labels[`_f_${i}`])
      })
      return res
    })
}
