export {isActionEnabled} from '../legacy/actionUtils'
export {
  DEFAULT_MAX_FIELD_DEPTH,
  resolveSearchConfig,
  resolveSearchConfigForBaseFieldPaths,
} from '../legacy/searchConfig/resolve'
export {extractSchema} from '../sanity/extractSchema'
export {groupProblems} from '../sanity/groupProblems'
export {
  type _FIXME_ as FIXME,
  type SchemaValidationResult as Problem,
  type ProblemPath,
  type ProblemPathPropertySegment,
  type ProblemPathSegment,
  type ProblemPathTypeSegment,
  type TypeWithProblems,
  type SchemaValidationResult as ValidationResult,
} from '../sanity/typedefs'
export {validateSchema} from '../sanity/validateSchema'
