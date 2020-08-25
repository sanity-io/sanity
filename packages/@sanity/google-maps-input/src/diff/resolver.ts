import {DiffComponentResolver} from '@sanity/field/diff'
import {GeopointFieldDiff} from './GeopointFieldDiff'
import {GeopointArrayDiff} from './GeopointArrayDiff'

const diffResolver: DiffComponentResolver = function diffResolver({schemaType}) {
  if (schemaType.name === 'geopoint') {
    return GeopointFieldDiff
  }

  if (
    schemaType.jsonType === 'array' &&
    schemaType.of.length === 1 &&
    schemaType.of[0].name === 'geopoint'
  ) {
    return GeopointArrayDiff
  }

  return undefined
}

export default diffResolver
