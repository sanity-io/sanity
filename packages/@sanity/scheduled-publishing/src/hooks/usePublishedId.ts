import {useMemo} from 'react'

export function usePublishedId<T extends string | undefined>(id: T): T {
  return useMemo(() => (id ? id.replace('drafts.', '') : undefined) as T, [id])
}
