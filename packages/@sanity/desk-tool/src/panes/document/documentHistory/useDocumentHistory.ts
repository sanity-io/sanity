import {useContext} from 'react'
import {DocumentHistoryContext, HistoryContextInstance} from './DocumentHistoryContext'

export function useDocumentHistory(): HistoryContextInstance {
  const instance = useContext(DocumentHistoryContext)

  if (!instance) {
    throw new Error(`missing document history context instance`)
  }

  return instance
}
