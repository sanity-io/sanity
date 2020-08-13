import {GeopointSchemaType, ArraySchemaType} from '../types'
import {GeopointFieldDiff} from './GeopointFieldDiff'
import {GeopointArrayDiff} from './GeopointArrayDiff'

export default function diffResolver({
  schemaType
}: {
  schemaType: GeopointSchemaType | ArraySchemaType
}) {
  if (schemaType.name === 'geopoint') {
    return GeopointFieldDiff
  }

  if (
    schemaType.name === 'array' &&
    schemaType.of.length === 1 &&
    schemaType.of[0].name === 'geopoint'
  ) {
    return GeopointArrayDiff
  }

  return undefined
}
