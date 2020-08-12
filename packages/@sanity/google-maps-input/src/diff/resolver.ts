import {GeopointSchemaType} from '../types'
import {GeopointFieldDiff} from './GeopointFieldDiff'

export default function diffResolver({schemaType}: {schemaType: GeopointSchemaType}) {
  if (schemaType.name === 'geopoint') {
    return GeopointFieldDiff
  }

  return undefined
}
