import {useEditor} from '@portabletext/editor'
import {
  createPortableTextMemberSchemaTypes,
  type PortableTextMemberSchemaTypes,
} from '@portabletext/sanity-bridge'
import {
  type ArraySchemaType,
  isArraySchemaType,
  type Path,
  type PortableTextBlock,
} from '@sanity/types'
import {type ReactNode, use, useMemo} from 'react'
import {PortableTextMemberSchemaTypesContext} from 'sanity/_singletons'

import {resolveSchemaTypeForPath} from '../../../../studio/copyPaste/resolveSchemaTypeForPath'

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

// The processed member types are non-trivial to build, so cache them per
// resolved array schema type. Array schema types are stable per compiled schema,
// so a WeakMap reuses the result across every block and leaf rendered under the
// same container, and never leaks across schema reloads.
const memberTypesByArrayType = new WeakMap<ArraySchemaType, PortableTextMemberSchemaTypes>()

function getMemberTypesForArrayType(arrayType: ArraySchemaType): PortableTextMemberSchemaTypes {
  let memberTypes = memberTypesByArrayType.get(arrayType)
  if (!memberTypes) {
    memberTypes = createPortableTextMemberSchemaTypes(
      arrayType as ArraySchemaType<PortableTextBlock>,
    )
    memberTypesByArrayType.set(arrayType, memberTypes)
  }
  return memberTypes
}

/**
 * Resolves the Portable Text array schema type that contains the block at
 * `blockPath`. Inside a container that is the container's array field; at the
 * root (or when resolution fails) it is `rootArrayType`. The containing array
 * sits one segment up from the block key.
 *
 * @internal
 */
export function resolveContainingArrayType(
  rootArrayType: ArraySchemaType,
  blockPath: Path,
  value: unknown,
): ArraySchemaType {
  const arrayPath = blockPath.slice(0, -1)
  if (arrayPath.length === 0) {
    return rootArrayType
  }
  const arrayType = resolveSchemaTypeForPath(rootArrayType, arrayPath, value)
  return arrayType && isArraySchemaType(arrayType) ? arrayType : rootArrayType
}

/**
 * Resolves the `PortableTextMemberSchemaTypes` for the block at `blockPath` by
 * walking to the block's containing array schema type. Inside a container the
 * block's styles, decorators, lists, and child types come from the container's
 * array, not the root Portable Text array; at the root it returns the same value
 * as `usePortableTextMemberSchemaTypes`.
 *
 * @internal
 */
export function usePortableTextMemberSchemaTypesForBlockPath(
  blockPath: Path,
): PortableTextMemberSchemaTypes {
  const rootMemberTypes = usePortableTextMemberSchemaTypes()
  const editor = useEditor()
  const arrayType = resolveContainingArrayType(
    rootMemberTypes.portableText,
    blockPath,
    editor.getSnapshot().context.value,
  )
  return arrayType === rootMemberTypes.portableText
    ? rootMemberTypes
    : getMemberTypesForArrayType(arrayType)
}
