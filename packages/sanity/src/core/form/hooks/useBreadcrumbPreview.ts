import {type Path, type SchemaType} from '@sanity/types'
import {useMemo} from 'react'

import {resolveSchemaTypeForPath} from '../../studio/copyPaste/resolveSchemaTypeForPath'
import {useFormValue} from '../contexts/FormValue'
import {useValuePreviewWithFallback} from '../studio/tree-editing/hooks/useValuePreviewWithFallback'

/**
 * Hook to get the preview title for a breadcrumb item.
 */
export function useBreadcrumbPreview(
  itemPath: Path,
  documentSchemaType: SchemaType,
  documentValue: unknown,
) {
  const value = useFormValue(itemPath)

  const schemaType = useMemo(
    () => resolveSchemaTypeForPath(documentSchemaType, itemPath, documentValue),
    [documentSchemaType, itemPath, documentValue],
  )

  const {value: preview} = useValuePreviewWithFallback({schemaType, value})

  return preview.title
}
