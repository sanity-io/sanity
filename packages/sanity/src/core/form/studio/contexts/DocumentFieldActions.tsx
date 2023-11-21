import React, {createContext, ReactNode, useMemo} from 'react'
import {DocumentFieldAction} from '../../../config'
import {EMPTY_ARRAY} from '../../../util'

export interface DocumentFieldActionsContextValue {
  actions: DocumentFieldAction[]
}

const DocumentFieldActionsContext = createContext<DocumentFieldActionsContextValue | null>(null)

export function DocumentFieldActionsProvider(props: {
  actions: DocumentFieldAction[] | undefined
  children: ReactNode
}) {
  const value = useMemo(() => ({actions: props.actions || EMPTY_ARRAY}), [props.actions])
  return (
    <DocumentFieldActionsContext.Provider value={value}>
      {props.children}
    </DocumentFieldActionsContext.Provider>
  )
}

export function useDocumentFieldActions() {
  const context = React.useContext(DocumentFieldActionsContext)
  if (!context) {
    throw new Error('useDocumentFieldActions must be used within a DocumentFieldActionsProvider')
  }
  return context.actions
}
