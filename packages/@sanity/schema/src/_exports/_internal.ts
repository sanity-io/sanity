export {
  type TypeWithProblems,
  type ProblemPathPropertySegment,
  type ProblemPathTypeSegment,
  type ProblemPathSegment,
  type ProblemPath,
  type SchemaValidationResult as Problem,
  type SchemaValidationResult as ValidationResult,
  type _FIXME_ as FIXME,
} from '../sanity/typedefs'

export {groupProblems} from '../sanity/groupProblems'
export {validateSchema} from '../sanity/validateSchema'

export {isActionEnabled} from '../legacy/actionUtils'
