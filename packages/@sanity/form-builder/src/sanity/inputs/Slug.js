function validateSlug(type, slug, myDocId) {
  let query

  if (myDocId) {
    query = `*[${type.name}.current == $slug && _id != $id]`
  } else {
    query = `*[${type.name}.current == $slug`
  }
  return client.fetch(query, {slug: slug, id: myDocId}).then(results => {
    if (results[0] && results[0]._id && !results[0]._id.startsWith('drafts.')) {
      const foundDocId = results[0]._id
      return `There is already a document (${foundDocId}) in the dataset with the slug '${slug}'.`
    }
    return null
  })
}
