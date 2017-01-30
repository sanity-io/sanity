import createSelector from './createSelector'
import client from 'part:@sanity/base/client'

export default createSelector((id, fields) => {
  return client.fetch(`*[_id == $id]{${fields.join(',')}}`, {id})
    .then(result => result[0])
})
