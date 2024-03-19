import {DeprecatedDefaultSchema, Schema as NamedSchema} from '../legacy/Schema'

export default DeprecatedDefaultSchema
export const Schema = NamedSchema
export {extractSchema} from '../sanity/extractSchema'
export {type SchemaValidationResult} from '../sanity/typedefs'
