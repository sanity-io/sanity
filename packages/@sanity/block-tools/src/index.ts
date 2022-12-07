import type {ArraySchemaType, PortableTextTextBlock} from '@sanity/types'
import blockContentTypeFeatures from './util/blockContentTypeFeatures'
import HtmlDeserializer from './HtmlDeserializer'
import {normalizeBlock} from './util/normalizeBlock'
import {BlockContentFeatures, HtmlDeserializerOptions, TypedObject} from './types'

/**
 * Convert HTML to blocks respecting the block content type's schema
 *
 * @param html - The HTML to convert to blocks
 * @param blockContentType - A compiled version of the schema type for the block content
 * @param options - Options for deserializing HTML to blocks
 * @returns Array of blocks
 * @public
 */
export function htmlToBlocks(
  html: string,
  blockContentType: ArraySchemaType,
  options: HtmlDeserializerOptions = {}
): (TypedObject | PortableTextTextBlock)[] {
  const deserializer = new HtmlDeserializer(blockContentType, options)
  return deserializer.deserialize(html).map((block) => normalizeBlock(block))
}

/**
 * Normalize and extract features of an schema type containing a block type
 *
 * @param blockContentType - Schema type for the block type
 * @returns Returns the featureset of a compiled block content type.
 * @public
 */
export function getBlockContentFeatures(blockContentType: ArraySchemaType): BlockContentFeatures {
  return blockContentTypeFeatures(blockContentType)
}

export {normalizeBlock}
export {randomKey} from './util/randomKey'
export type {TypedObject, HtmlDeserializerOptions, BlockContentFeatures}
export type {
  ResolvedAnnotationType,
  DeserializerRule,
  HtmlParser,
  ArbitraryTypedObject,
  BlockEditorSchemaProps,
} from './types'
export type {BlockNormalizationOptions} from './util/normalizeBlock'
