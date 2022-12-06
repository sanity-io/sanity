import {useContext} from 'react'
import {CommandListContext, CommandListContextValue} from './CommandListContext'

export function useCommandList(): CommandListContextValue {
  const context = useContext(CommandListContext)
  if (context === undefined) {
    throw new Error('useCommandList must be used within a CommandListProvider')
  }
  return context
}
