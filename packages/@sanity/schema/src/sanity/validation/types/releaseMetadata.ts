import {
  releaseMetadataCoreFieldNames,
  releaseMetadataCoreFields,
} from '../../builtinTypes/releaseMetadata'
import {error} from '../createValidationResult'

/**
 * A schema may replace `sanity.releaseMetadata` to add fields, but the release
 * actions and the releases tool read and write its core fields, so those always
 * come from the built-in definition, like the asset fields of `image`.
 */
export default (typeDef: any) => {
  if (typeDef.type !== 'object') {
    return {
      ...typeDef,
      _problems: [
        error(`The "${typeDef.name}" type must be an object type, but it is "${typeDef.type}".`),
      ],
    }
  }

  const fields: unknown[] = Array.isArray(typeDef.fields) ? typeDef.fields : []
  // `resolveReleaseTypes` adds the built-in core field definitions, so a field with a
  // core name that is not one of those objects was declared by the schema.
  const redeclaresCoreField = fields.some(
    (field: any) =>
      field &&
      releaseMetadataCoreFieldNames.includes(field.name) &&
      !releaseMetadataCoreFields.includes(field),
  )

  return {
    ...typeDef,
    _problems: redeclaresCoreField
      ? [
          error(
            `The names \`${releaseMetadataCoreFieldNames.join('`, `')}\` are invalid field names for type \`${typeDef.name}\`. These core fields are always included.`,
          ),
        ]
      : [],
  }
}
