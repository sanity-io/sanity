import {
  createPortableTextMemberSchemaTypes,
  type PortableTextMemberSchemaTypes,
} from '@portabletext/sanity-bridge'
import {type ArraySchemaType, type PortableTextBlock} from '@sanity/types'
import {type ReactNode, use, useMemo} from 'react'
import {PortableTextMemberSchemaTypesContext} from 'sanity/_singletons'

/**
 * Provider for Sanity-specific schema types for Portable Text.
 * Derives `PortableTextMemberSchemaTypes` from the Sanity `ArraySchemaType` prop
 * and provides it via context for Sanity-specific lookups instead of `editor.schemaTypes`.
 *
 * @internal
 */
export function PortableTextMemberSchemaTypesProvider({
  schemaType,
  children,
}: {
  schemaType: ArraySchemaType<PortableTextBlock>
  children: ReactNode
}) {
  const value = useMemo(() => createPortableTextMemberSchemaTypes(schemaType), [schemaType])

  return (
    <PortableTextMemberSchemaTypesContext.Provider value={value}>
      {children}
    </PortableTextMemberSchemaTypesContext.Provider>
  )
}

/**
 * Hook to access Sanity-specific schema types for Portable Text.
 * Use this instead of `editor.schemaTypes` for accessing Sanity-specific properties
 * like `options.oneLine`, `options.spellCheck`, `icon`, `i18nTitleKey`, etc.
 *
 * @internal
 */
export function usePortableTextMemberSchemaTypes(): PortableTextMemberSchemaTypes {
  const context = use(PortableTextMemberSchemaTypesContext)
  if (!context) {
    throw new Error(
      'usePortableTextMemberSchemaTypes must be used within PortableTextMemberSchemaTypesProvider',
    )
  }
  return context
}
