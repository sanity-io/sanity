import client from 'part:@sanity/base/client'
import {SlugInput} from '../../index'

function validateSlug(type, slug) {
  return client.fetch(`*[${type.name}.slug == $slug]`, {slug: slug}).then(results => {
    if (results[0]) {
      return `There is already a document (${results[0]._id}) in the dataset with this slug.`
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
