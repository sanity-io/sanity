import {createContext, useContext} from 'react'
import {CommandListContextValue} from './types'

export const CommandListContext = createContext<CommandListContextValue>({
  items: [],
  ScrollElement: () => '' as any,
  virtualItems: [],
  activeIndex: -1,
  commandListId: '',
})

export const useCommandList = (): CommandListContextValue => {
  return useContext(CommandListContext)
}
