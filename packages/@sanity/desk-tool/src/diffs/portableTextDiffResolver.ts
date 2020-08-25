import {DiffComponentResolver} from '@sanity/field/diff'
import {PTDiff, isPTSchemaType} from './portableText'

const diffResolver: DiffComponentResolver = function diffResolver({schemaType}) {
  return isPTSchemaType(schemaType) ? PTDiff : undefined
}

export default diffResolver
