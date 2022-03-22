import type React from 'react'
export interface StyleSelectItem {
  key?: string
  title?: string
  active?: boolean
}
interface StyleSelectProps {
  placeholder?: string
  disabled?: boolean
  onChange: (item: StyleSelectItem) => void
  onOpen: () => void
  onClose: () => void
  value?: StyleSelectItem[]
  renderItem: (item: StyleSelectItem) => React.ReactNode
  className?: string
  items: StyleSelectItem[]
  padding?: 'large' | 'default' | 'small' | 'none'
  transparent?: boolean
}
declare class StyleSelect extends React.PureComponent<StyleSelectProps> {
  static defaultProps: {
    className: string
    onChange: () => any
    onOpen: () => any
    onClose: () => any
    items: any[]
    padding: string
    placeholder: any
    transparent: boolean
    value: any
  }
  state: {
    showList: boolean
  }
  buttonElement: React.RefObject<HTMLButtonElement>
  firstItemElement: React.RefObject<HTMLDivElement>
  keyboardNavigation: boolean
  menuHasKeyboardFocus: boolean
  handleItemClick: (event: React.MouseEvent<HTMLDivElement>) => void
  handleSelect: (index: number) => void
  handleOpenList: () => void
  handleCloseList: () => void
  handleButtonClick: (event: any) => void
  handleButtonKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
  handleButtonBlur: () => void
  handleMenuBlur: () => void
  handleItemKeyPress: (event: React.KeyboardEvent<HTMLDivElement>) => void
  render(): JSX.Element
}
export default StyleSelect
