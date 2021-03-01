import {useContext} from 'react'
import {DocumentHistoryContext} from './context'

export function useDocumentHistory() {
  const instance = useContext(DocumentHistoryContext)

  if (!instance) {
    throw new Error(`missing document history context instance`)
  }

  return instance
}
