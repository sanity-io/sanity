export {DescriptorConverter} from '../descriptors/convert'
export * from '../descriptors/sync'
export {isActionEnabled} from '../legacy/actionUtils'
export {
  DEFAULT_MAX_FIELD_DEPTH,
  resolveSearchConfig,
  resolveSearchConfigForBaseFieldPaths,
} from '../legacy/searchConfig/resolve'
export {ALL_FIELDS_GROUP_NAME} from '../legacy/types/constants'
export {createSchemaFromManifestTypes} from '../manifest/createSchemaFromManifestTypes'
export {
  extractCreateWorkspaceManifest,
  extractManifestSchemaTypes,
  type IconResolver,
} from '../manifest/extractManifestSchemaTypes'
export {isDefined} from '../manifest/manifestTypeHelpers'
export {
  type CreateManifest,
  type CreateWorkspaceManifest,
  CURRENT_WORKSPACE_SCHEMA_VERSION,
  type DefaultWorkspaceSchemaId,
  type ManifestSchemaType,
  type ManifestWorkspaceFile,
  SANITY_WORKSPACE_SCHEMA_ID_PREFIX,
  SANITY_WORKSPACE_SCHEMA_TYPE,
  type StoredWorkspaceSchema,
  type WorkspaceSchemaId,
} from '../manifest/manifestTypes'
export {builtinTypes} from '../sanity/builtinTypes'
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
export {validateMediaLibraryAssetAspect} from '../sanity/validateMediaLibraryAssetAspect'
export {validateSchema} from '../sanity/validateSchema'
export {ValidationError} from '../sanity/validation/ValidationError'
