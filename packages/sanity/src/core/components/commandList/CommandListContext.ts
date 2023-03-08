import {Virtualizer} from '@tanstack/react-virtual'
import {createContext, Dispatch, MouseEvent, SetStateAction} from 'react'
import type {CommandListProviderProps, CommandListVirtualItemValue} from './CommandListProvider'

export interface CommandListContextValue<T> {
  fixedHeight?: CommandListProviderProps<T>['fixedHeight']
  focusElement: () => void
  getTopIndex: () => number
  itemComponent: CommandListProviderProps<T>['itemComponent']
  itemIndices: (number | null)[]
  onChildMouseDown: (event: MouseEvent) => void
  onChildMouseEnter: (index: number) => () => void
  setChildContainerElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  setInputElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  setPointerOverlayElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  setVirtualListElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  values: CommandListVirtualItemValue<T>[]
  virtualizer?: Virtualizer<HTMLDivElement, Element> | null
  virtualListElement: HTMLDivElement | null
}

export const CommandListContext = createContext<CommandListContextValue<unknown> | undefined>(
  undefined
)
