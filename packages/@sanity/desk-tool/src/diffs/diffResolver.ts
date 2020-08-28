import {DiffComponentResolver} from '@sanity/field/diff'
import {DatetimeFieldDiff} from './datetime'

const diffResolver: DiffComponentResolver = function diffResolver({schemaType}) {
  // datetime or date
  if (['datetime', 'date'].includes(schemaType.name)) {
    return DatetimeFieldDiff
  }
  return undefined
}

export default diffResolver
