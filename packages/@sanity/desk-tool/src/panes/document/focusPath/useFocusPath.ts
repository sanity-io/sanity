import {useContext} from 'react'
import {FocusPathContext} from './FocusPathContext'

export function useFocusPath() {
  const context = useContext(FocusPathContext)
  if (!context) {
    throw new Error('useFocusPath() called outside of a DocumentPaneContext provider')
  }
  return context
}
