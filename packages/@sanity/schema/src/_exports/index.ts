import {DeprecatedDefaultSchema, Schema as NamedSchema} from '../legacy/Schema'

export default DeprecatedDefaultSchema
export const Schema = NamedSchema
export {Rule} from '../legacy/Rule'
export {DEFAULT_ANNOTATIONS, DEFAULT_DECORATORS} from '../legacy/types/blocks/defaults'
export {type SchemaValidationResult} from '../sanity/typedefs'
