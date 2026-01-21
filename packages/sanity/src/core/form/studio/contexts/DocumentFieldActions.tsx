import {type ReactNode, useContext, useMemo} from 'react'
import {DocumentFieldActionsContext} from 'sanity/_singletons'

import type {DocumentFieldAction} from '../../../config/document/fieldActions/types'
import {EMPTY_ARRAY} from '../../../util/empty'

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
  const context = useContext(DocumentFieldActionsContext)
  if (!context) {
    throw new Error('useDocumentFieldActions must be used within a DocumentFieldActionsProvider')
  }
  return context.actions
}
