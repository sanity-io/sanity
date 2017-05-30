
// Example of a custom slugify function that
// makes a slug-string and prefixes it with something from the
// schema and then calls the default slugify function.
import {deburr, kebabCase} from 'lodash'

export default function slugifyWithPrefix(prefix) {
  const prefixRe = new RegExp(`^${prefix}-`)
  return function (type, value, slugify) {
    return kebabCase(deburr(`${prefix}-${value.replace(prefixRe, '')}`))
  }
}
