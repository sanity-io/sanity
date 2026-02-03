import type {PortableTextMemberSchemaTypes} from '@portabletext/sanity-bridge'
import {createContext} from 'sanity/_createContext'

/**
 * Context for Sanity-specific schema types for Portable Text.
 * This provides access to the full Sanity schema types instead of relying on
 * `editor.schemaTypes` from PTE, which will contain minimal PT schema types
 * when PTE removes its Sanity dependencies.
 *
 * @internal
 */
export const PortableTextMemberSchemaTypesContext =
  createContext<PortableTextMemberSchemaTypes | null>(
    'sanity/_singletons/context/portable-text-member-schema-types',
    null,
  )
