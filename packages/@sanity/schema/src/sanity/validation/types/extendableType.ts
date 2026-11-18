import {findExtendableType} from '../../systemTypes/extendableTypes'
import {error} from '../createValidationResult'

/**
 * A schema may replace an extendable type to add fields, but Studio features
 * read and write its core fields, so those always come from the built-in
 * definition, like the asset fields of `image`.
 */
export default (typeDef: any) => {
  const extendable = findExtendableType(typeDef.name)
  if (!extendable) return {...typeDef, _problems: []}

  if (typeDef.type !== 'object') {
    return {
      ...typeDef,
      _problems: [
        error(`The "${typeDef.name}" type must be an object type, but it is "${typeDef.type}".`),
      ],
    }
  }

  const coreFieldNames = extendable.fields.map((field) => field.name)
  const fields: unknown[] = Array.isArray(typeDef.fields) ? typeDef.fields : []
  // `resolveExtendableTypes` adds the built-in core field definitions, so a field with a
  // core name that is not one of those objects was declared by the schema.
  const redeclaresCoreField = fields.some(
    (field: any) =>
      field && coreFieldNames.includes(field.name) && !extendable.fields.includes(field),
  )

  return {
    ...typeDef,
    _problems: redeclaresCoreField
      ? [
          error(
            `The names \`${coreFieldNames.join('`, `')}\` are invalid field names for type \`${typeDef.name}\`. These core fields are always included.`,
          ),
        ]
      : [],
  }
}
