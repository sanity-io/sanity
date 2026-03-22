import {type ReactNode, useContext, useMemo} from 'react'
import {DocumentIdContext} from 'sanity/_singletons'

import {getPublishedId} from '../../util'

export function DocumentIdProvider(props: {id: string; children: ReactNode}) {
  const value = useMemo(() => ({id: props.id}), [props.id])
  return <DocumentIdContext.Provider value={value}>{props.children}</DocumentIdContext.Provider>
}

function useGivenDocumentId(): string {
  const ctx = useContext(DocumentIdContext)
  if (!ctx) {
    throw new Error('useDocumentId must be used within a DocumentIdProvider')
  }
  return ctx.id
}

/**
 * @internal
 */
export function usePublishedId(): string | undefined {
  return getPublishedId(useGivenDocumentId())
}
