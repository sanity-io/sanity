import {DatetimeFieldDiff} from '../../types/datetime/diff'
import {UrlFieldDiff} from '../../types/url/diff'
import {SlugFieldDiff} from '../../types/slug/diff'
import {isPTSchemaType, PTDiff} from '../../types/portableText/diff'
import {DiffComponentResolver} from '../../types'

export const diffResolver: DiffComponentResolver = function diffResolver({schemaType}) {
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

  if (isPTSchemaType(schemaType)) {
    return PTDiff
  }

  return undefined
}
