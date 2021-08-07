import React from 'react'
import {Item} from 'part:@sanity/components/lists/default'
declare type Item = unknown
interface SelectMenuProps {
  items?: Item[]
  renderItem?: (item: Item, index: number) => React.ReactNode
  value?: Item
  highlightIndex?: number
  onSelect?: (item: Item) => void
}
export default class SelectMenu extends React.Component<SelectMenuProps> {
  scrollContainer: HTMLDivElement | null
  handleItemClick: (event: any) => void
  componentDidUpdate(prevProps: any): void
  setScrollContainer: (domNode: HTMLDivElement | null) => void
  render(): JSX.Element
}
export {}
