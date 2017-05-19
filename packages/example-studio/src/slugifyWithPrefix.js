
// Example of a custom slugify function that
// makes a slug-string and prefixes it with something from the
// schema and then calls the default slugify function.
export default function slugifyWithPrefix(prefix) {
  return function (type, slug, slugify) {
    let newSlug = slug
    if (slug.substring(0, prefix.length) === `${prefix}`) {
      newSlug = slug.substring(prefix.length, slug.length)
    }
    return slugify(type, `${prefix}-${newSlug}`)
      .substring(0, type.options.maxLength)
  }
}
