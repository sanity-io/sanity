import createSelector from './createSelector'

export default createSelector((id, type, fields) => {
  console.log('fetch doc with id %s of type %s', id, type.name, fields)
  return Promise.resolve()
})
