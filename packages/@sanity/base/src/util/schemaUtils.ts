import {Schema} from '@sanity/types'

const BUNDLED_DOC_TYPES = ['sanity.imageAsset', 'sanity.fileAsset']

/**
 * @internal
 */
export function _isSanityDocumentTypeDefinition(
  def: Schema.TypeDefinition
): def is Schema.TypeDefinition<'document'> {
  return def.type === 'document' && BUNDLED_DOC_TYPES.includes(def.name)
}

/**
 * @internal
 */
export function _isCustomDocumentTypeDefinition(
  def: Schema.TypeDefinition
): def is Schema.TypeDefinition<'document'> {
  return def.type === 'document' && !_isSanityDocumentTypeDefinition(def)
}
