import {useMemo} from 'react'
import {useSchema} from 'sanity'
import {type DocumentListPaneNode} from 'sanity/structure'

import {EMPTY_RECORD} from './constants'
import {applyOrderingFunctions, findStaticTypesInFilter, useShallowUnique} from './helpers'
import {type SortOrder} from './types'

export const useDocumentListSort = (pane: DocumentListPaneNode, sortOrderRaw?: SortOrder) => {
  const schema = useSchema()
  const {options} = pane
  const {filter, params: paneParams} = options
  const params = useShallowUnique(paneParams || EMPTY_RECORD)
  const typeName = useMemo(() => {
    const staticTypes = findStaticTypesInFilter(filter, params)
    if (staticTypes?.length === 1) return staticTypes[0]
    return null
  }, [filter, params])

  const sortWithOrderingFn = useMemo(
    () =>
      typeName && sortOrderRaw
        ? applyOrderingFunctions(sortOrderRaw, schema.get(typeName) as any)
        : sortOrderRaw,
    [schema, sortOrderRaw, typeName],
  )

  return sortWithOrderingFn
}
