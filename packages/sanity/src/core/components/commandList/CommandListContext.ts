import {Virtualizer} from '@tanstack/react-virtual'
import {createContext, Dispatch, MouseEvent, SetStateAction} from 'react'

export interface CommandListContextValue {
  focusInputElement: () => void
  getTopIndex: () => number
  itemIndices: (number | null)[]
  onChildMouseDown: (event: MouseEvent) => void
  onChildMouseEnter: (index: number) => () => void
  setChildContainerElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  setContainerElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  setInputElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  setPointerOverlayElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  setVirtualizer: (virtualizer: Virtualizer<HTMLDivElement, Element>) => void
  virtualizer?: Virtualizer<HTMLDivElement, Element> | null
}

export const CommandListContext = createContext<CommandListContextValue | undefined>(undefined)
