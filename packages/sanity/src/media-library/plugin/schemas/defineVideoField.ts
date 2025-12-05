import {defineField, type FieldDefinitionBase} from '@sanity/types'

import {type VideoDefinition} from './types'

/**
 * Define a video field within a document, object, image or file definition `fields` array.
 *
 * This function will narrow the schema type down to video fields and options based on the provided
 * type-string.
 *
 * Using `defineVideoField` is optional, but should provide improved autocompletion in your IDE, when building your schema.
 * Video field-properties like `validation` and `initialValue` will also be more specific.
 *
 * Note: This video field type is designed to work specifically with the Media Library asset source.
 * Make sure you have the Media Library is enabled in your studio via sanity.config.ts.
 *
 * See {@link defineType} for similar examples.
 *
 * @param definition - should be a valid video field type definition.
 *
 * @see defineField
 * @see defineArrayMember
 * @see typed
 *
 * @beta
 */
export function defineVideoField(definition: Omit<VideoDefinition, 'type'> & FieldDefinitionBase) {
  // @ts-expect-error FIXME
  return defineField({
    ...definition,
    type: 'sanity.video',
  })
}
