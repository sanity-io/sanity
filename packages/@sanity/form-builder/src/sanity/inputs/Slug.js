import client from 'part:@sanity/base/client'
import {SlugInput} from '../../index'

function validateSlug(type, slug, myDocId) {
  let query
  if (myDocId) {
    query = `*[${type.name}.current == $slug && _id != $id]`
  } else {
    query = `*[${type.name}.current == $slug`
  }
  return client.fetch(query, {slug: slug, id: myDocId})
    .then(results => {
      if (results[0]) {
        const foundDocId = results[0]._id
        return `There is already a document (${foundDocId}) `
          + `in the dataset with the slug '${slug}'.`
      }
      return null
    })
}

// Default slugify for Sanity
function slugify(type, slug) {
  return slug.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')       // Remove all non-word chars
    .replace(/--+/g, '-')         // Replace multiple - with single -
    .substring(0, type.options.maxLength)
}

export default SlugInput.create({validate: validateSlug, slugify: slugify})
