import {createContext, Dispatch, MouseEvent, SetStateAction} from 'react'

export interface CommandListContextValue {
  focusHeaderInputElement: () => void
  itemIndices: (number | null)[]
  onChildMouseDown: (event: MouseEvent) => void
  onChildMouseEnter: (index: number) => () => void
  setContainerElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  setHeaderInputElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  setPointerOverlayElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  setVirtualListScrollToIndex: (scrollToIndex: (index: number, options?: any) => void) => void
}

export const CommandListContext = createContext<CommandListContextValue | undefined>(undefined)
