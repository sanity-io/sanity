import {DiffComponentResolver} from '@sanity/field/diff'
import {DatetimeFieldDiff} from './datetime'
import {UrlFieldDiff} from './url'

const diffResolver: DiffComponentResolver = function diffResolver({schemaType}) {
  // datetime or date
  if (['datetime', 'date'].includes(schemaType.name)) {
    return DatetimeFieldDiff
  }
  if (schemaType.name === 'url') {
    return UrlFieldDiff
  }
  return undefined
}

export default diffResolver
