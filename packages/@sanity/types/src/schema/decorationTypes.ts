import {type IncomingReferencesOptions} from './definition/decoration/incomingReferences'
import {type StringDefinition} from './definition/type/string'
import {type AutocompleteString} from './types'

interface IncomingReferencesDecorationDefinition {
  type: 'incomingReferences'
  title?: string
  description?: StringDefinition['description']
  hidden?: StringDefinition['hidden']
  options: IncomingReferencesOptions
}
interface IntrinsicDecorationDefinition {
  incomingReferences: IncomingReferencesDecorationDefinition
}

type IntrinsicBase = {
  [K in keyof IntrinsicDecorationDefinition]: IntrinsicDecorationDefinition[K]
}

type DefineSchemaBase<TType extends string> = TType extends IntrinsicDecorationTypeName
  ? IntrinsicBase[TType]
  : Record<string, any>

type IntrinsicDecorationTypeName =
  IntrinsicDecorationDefinition[keyof IntrinsicDecorationDefinition]['type']

/**
 * Helper function to define a decoration type.
 * Decoration types are used to decorate the form with additional components (like the incoming references decoration)
 *
 * They are for presentational purposes only.
 *
 * @beta
 */
export function defineDecoration<
  const TType extends IntrinsicDecorationTypeName | AutocompleteString,
  const TName extends string,
>(
  schemaDefinition: {
    type: TType
    name: TName
  } & DefineSchemaBase<TType>,
) {
  return {
    ...schemaDefinition,
    // TODO: add sanity.decoration type to the schema definition.
    type: 'string',
    // TODO: Temporally used to detect if the type is a decoration type.
    //  eslint-disable-next-line camelcase
    __internal_isDecoration: true,
    options: {
      // TODO: Temporally used to exclude the type from the canvas app and sanity create.
      canvasApp: {exclude: true},
      sanityCreate: {exclude: true},
      ...schemaDefinition.options,
    },
  }
}
