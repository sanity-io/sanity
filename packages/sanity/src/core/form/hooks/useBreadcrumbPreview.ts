import {
  isArraySchemaType,
  isKeySegment,
  isPortableTextSpan,
  isPortableTextTextBlock,
  type Path,
  type SchemaType,
} from '@sanity/types'
import {useMemo} from 'react'

import {resolveSchemaTypeForPath} from '../../studio/copyPaste/resolveSchemaTypeForPath'
import {useFormValue} from '../contexts/FormValue'
import {useValuePreviewWithFallback} from '../studio/tree-editing/hooks/useValuePreviewWithFallback'

/**
 * Given a block value and a markDef key, returns the concatenated text of
 * all spans that reference this markDef.
 */
function getAnnotatedText(blockValue: unknown, markDefKey: string): string | undefined {
  if (!isPortableTextTextBlock(blockValue)) return undefined
  const texts = blockValue.children
    .filter((child) => isPortableTextSpan(child) && child.marks?.includes(markDefKey))
    .map((child) => (isPortableTextSpan(child) ? child.text : ''))
  return texts.length > 0 ? texts.join('') : undefined
}

/**
 * If `itemPath` ends with `'markDefs'`, resolves the active markDef key from
 * `currentPath` and returns the block path + key.
 * This is important for the preview as only "markDefs" will not know what's the value of the block
 * (it needs the key that follows)
 */
function getMarkDefContext(
  itemPath: Path,
  currentPath: Path | undefined,
): {blockPath: Path; markDefKey: string} | undefined {
  if (!currentPath) return undefined
  const lastSegment = itemPath[itemPath.length - 1]
  if (lastSegment !== 'markDefs') return undefined

  const nextSegment = currentPath[itemPath.length]
  if (!isKeySegment(nextSegment)) return undefined

  return {
    blockPath: itemPath.slice(0, -1),
    markDefKey: nextSegment._key,
  }
}

/**
 * Hook to get the preview title for a breadcrumb item.
 */
export function useBreadcrumbPreview(
  itemPath: Path,
  documentSchemaType: SchemaType,
  documentValue: unknown,
  currentPath?: Path,
) {
  const markDefContext = useMemo(
    () => getMarkDefContext(itemPath, currentPath),
    [itemPath, currentPath],
  )
  const value = useFormValue(markDefContext?.blockPath ?? itemPath)

  const schemaType = useMemo(
    () => resolveSchemaTypeForPath(documentSchemaType, itemPath, documentValue),
    [documentSchemaType, itemPath, documentValue],
  )

  const {value: preview} = useValuePreviewWithFallback({schemaType, value})

  if (markDefContext) {
    const annotatedText = getAnnotatedText(value, markDefContext.markDefKey)
    if (annotatedText) return annotatedText
  }

  return isArraySchemaType(schemaType) ? schemaType.title : preview.title
}
