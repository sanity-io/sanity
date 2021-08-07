import React from 'react'
interface CustomSelectProps {
  onChange: (item: any) => void
  value: Record<any, any>
  renderItem: (
    item: any,
    params?: {
      index: number
      isActive: boolean
      isSelected: boolean
    }
  ) => React.ReactNode
  items: any[]
}
export default class CustomSelect extends React.Component<CustomSelectProps> {
  static defaultProps: {
    onChange: () => any
  }
  state: {
    isOpen: boolean
    activeIndex: number
  }
  handleItemClick: (event: any) => void
  selectIndex(index: any): void
  handleInnerClick: () => void
  handleKeyDown: (event: any) => void
  render(): JSX.Element
}
export {}
