import {DiffComponentResolver} from '@sanity/field/diff'
import {DatetimeFieldDiff} from './datetime'
import {UrlFieldDiff} from './url'
import {SlugFieldDiff} from './slug'

const diffResolver: DiffComponentResolver = function diffResolver({schemaType}) {
  // datetime or date
  if (['datetime', 'date'].includes(schemaType.name)) {
    return DatetimeFieldDiff
  }
  if (schemaType.name === 'url') {
    return UrlFieldDiff
  }
  if (schemaType.name === 'slug') {
    return SlugFieldDiff
  }
  return undefined
}

export default diffResolver
