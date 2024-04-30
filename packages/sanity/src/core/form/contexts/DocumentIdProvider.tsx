import {type ReactNode, useContext, useMemo} from 'react'
import {DocumentIdContext} from 'sanity/_singletons'

import {getDraftId, getPublishedId} from '../../util'

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
export function useDocumentIds() {
  return {draft: useDraftId(), published: usePublishedId()}
}

/**
 * @deprecated Use `usePublishedId` instead
 */
export function useFormPublishedId(): string | undefined {
  return usePublishedId()
}

/**
 * @internal
 */
export function usePublishedId(): string | undefined {
  return getPublishedId(useGivenDocumentId())
}

/**
 * @internal
 */
export function useDraftId(): string | undefined {
  return getDraftId(useGivenDocumentId())
}
