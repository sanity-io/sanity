import {type DiffComponentResolver} from '../../types'
import {ArrayOfOptionsFieldDiff} from '../../types/array/diff/ArrayOfOptionsFieldDiff'
import {DatetimeFieldDiff} from '../../types/datetime/diff/DatetimeFieldDiff'
import {SlugFieldDiff} from '../../types/slug/diff/SlugFieldDiff'
import {UrlFieldDiff} from '../../types/url/diff/UrlFieldDiff'

/** @internal */
export const diffResolver: DiffComponentResolver = ({schemaType}) => {
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

  if (schemaType.jsonType === 'array' && Array.isArray(schemaType.options?.list)) {
    return ArrayOfOptionsFieldDiff
  }

  return undefined
}
