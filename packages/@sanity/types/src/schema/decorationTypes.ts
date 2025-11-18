import {FormDecorationDefinition} from './definition'
import {type IncomingReferencesOptions} from './definition/decoration/incomingReferences'
import {type AutocompleteString} from './types'

interface IncomingReferencesDecorationDefinition {
  type: 'incomingReferences'
  title?: string
  description?: FormDecorationDefinition['description']
  hidden?: FormDecorationDefinition['hidden']
  options: IncomingReferencesOptions
}

interface IntrinsicDecorationDefinition {
  incomingReferences: IncomingReferencesDecorationDefinition
  formDecoration: FormDecorationDefinition
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
    type: IntrinsicDecorationTypeName
    name: TName
  } & DefineSchemaBase<TType>,
) {
  return schemaDefinition
}
