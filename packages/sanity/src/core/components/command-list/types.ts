import {VirtualItem} from '@tanstack/react-virtual'

export interface ItemContext extends VirtualItem {
  active: boolean
}

export interface CommandListProviderProps {
  height: number
  itemHeight: number
  items: any[]
  multiSelect?: boolean
  overScan?: number
  children: React.ReactNode
}

export interface ScrollElementProps {
  children: React.ReactNode
}

export interface CommandListContextValue {
  activeIndex: number
  items: any[]
  commandListId: string
  ScrollElement: (props: ScrollElementProps) => React.ReactElement
  virtualItems: {
    item: any
    context: ItemContext
  }[]
}
