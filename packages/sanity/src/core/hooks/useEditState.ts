import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {debounce, map, merge, share, skip, take, timer} from 'rxjs'

import {useSchema} from '../hooks/useSchema'
import {type EditStateFor, useDocumentStore} from '../store'

/** @internal */
export function useEditState(
  publishedDocId: string,
  docTypeName: string,
  priority: 'default' | 'low' = 'default',
  version?: string,
): EditStateFor & {
  type: string
  /**
   * Whether live edit is enabled. This may be true for various reasons:
   *
   * - The schema type has live edit enabled.
   * - A version of the document is checked out.
   */
  liveEdit: boolean
  /**
   * Whether the schema type has live edit enabled.
   */
  liveEditSchemaType: boolean
} {
  if (version === 'published' || version === 'draft') {
    throw new Error('Version cannot be published or draft')
  }
  const documentStore = useDocumentStore()
  const schema = useSchema()
  const schemaType = schema.get(docTypeName)

  if (!schemaType) {
    throw new Error(`Schema type for '${docTypeName}' not found`)
  }
  const liveEditSchemaType = Boolean(schemaType.liveEdit)
  // Editing a release version of the document or the schema type has live edit enabled
  const liveEdit = Boolean(version) || liveEditSchemaType

  const observable = useMemo(() => {
    const getBaseObservable = () => {
      if (priority === 'low') {
        const base = documentStore.pair
          .editState(publishedDocId, docTypeName, version)
          .pipe(share())

        return merge(
          base.pipe(take(1)),
          base.pipe(
            skip(1),
            debounce(() => timer(1000)),
          ),
        )
      }

      return documentStore.pair.editState(publishedDocId, docTypeName, version)
    }
    return getBaseObservable().pipe(
      map((state) => ({
        ...state,
        type: docTypeName,
        liveEdit,
        liveEditSchemaType,
      })),
    )
  }, [
    docTypeName,
    documentStore.pair,
    priority,
    publishedDocId,
    version,
    liveEdit,
    liveEditSchemaType,
  ])
  /**
   * We know that since the observable has a startWith operator, it will always emit a value
   * and that's why the non-null assertion is used here
   */
  return useObservable(observable)!
}
