module.exports = function documentHasErrors(doc) {
  if (typeof doc._id !== 'string') {
    return `Document did not contain required "_id" property of type string`
  }

  if (typeof doc._type !== 'string') {
    return `Document did not contain required "_type" property of type string`
  }

  return null
}
