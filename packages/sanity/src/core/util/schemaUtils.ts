import {SchemaTypeDefinition} from '@sanity/types'

const BUNDLED_DOC_TYPES = ['sanity.imageAsset', 'sanity.fileAsset']

/**
 * @internal
 */
export function _isSanityDocumentTypeDefinition(
  def: SchemaTypeDefinition,
): def is SchemaTypeDefinition<'document'> {
  return def.type === 'document' && BUNDLED_DOC_TYPES.includes(def.name)
}

/**
 * @internal
 */
export function _isCustomDocumentTypeDefinition(
  def: SchemaTypeDefinition,
): def is SchemaTypeDefinition<'document'> {
  return def.type === 'document' && !_isSanityDocumentTypeDefinition(def)
}
