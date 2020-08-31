import {DatetimeFieldDiff} from '../components/datetime'
import {UrlFieldDiff} from '../components/url'
import {SlugFieldDiff} from '../components/slug'
import {isPTSchemaType, PTDiff} from '../components/portableText'
import {DiffComponentResolver} from '../types'

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
