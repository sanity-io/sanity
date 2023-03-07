import {useContext} from 'react'
import {CommandListContext, CommandListContextValue} from './CommandListContext'

/**
 * @internal
 */
export function useCommandList<T>(): CommandListContextValue<T | unknown> {
  const context = useContext(CommandListContext)
  if (context === undefined) {
    throw new Error('useCommandList must be used within a CommandListProvider')
  }
  return context
}
