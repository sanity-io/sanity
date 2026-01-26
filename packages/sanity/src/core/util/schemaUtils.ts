import {type SchemaType, type SchemaTypeDefinition} from '@sanity/types'

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

/**
 * Test if the given schema type or any of its ancestors matches the given type name.
 * @internal
 */
export function _isType(schemaType: SchemaType, typeName: string): boolean {
  if (schemaType.name === typeName) {
    return true
  }
  if (!schemaType.type) {
    return false
  }
  return _isType(schemaType.type, typeName)
}
