import React, {createContext, ReactNode, useContext, useMemo} from 'react'
import {getDraftId, getPublishedId} from '../../util'

export interface DocumentIdContextValue {
  id: string
}

const DocumentIdContext = createContext<DocumentIdContextValue | null>(null)

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

export function useDocumentIds() {
  return {draft: useDraftId(), published: usePublishedId()}
}

/**
 * @deprecated Use `usePublishedDocumentId` instead
 */
export function useFormPublishedId(): string | undefined {
  return usePublishedId()
}
export function usePublishedId(): string | undefined {
  return getPublishedId(useGivenDocumentId())
}
export function useDraftId(): string | undefined {
  return getDraftId(useGivenDocumentId())
}
