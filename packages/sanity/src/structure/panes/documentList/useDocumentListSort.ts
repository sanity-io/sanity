import {useMemo} from 'react'
import {useSchema} from 'sanity'

import {applyOrderingFunctions} from './helpers'
import {type SortOrder} from './types'

export const useDocumentListSort = (typeName: string | null, sortOrderRaw?: SortOrder) => {
  const schema = useSchema()

  return useMemo(
    () =>
      typeName && sortOrderRaw
        ? applyOrderingFunctions(sortOrderRaw, schema.get(typeName) as any)
        : sortOrderRaw,
    [schema, sortOrderRaw, typeName],
  )
}
