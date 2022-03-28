// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import type React from 'react'
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
