import type React from 'react'
interface HistoryListItemProps {
  status?: string
  title?: string
  children?: React.ReactNode
  isCurrentVersion?: boolean
  isSelected?: boolean
  onSelect: (evt: React.MouseEvent<HTMLDivElement>) => void
  onEnterKey: () => void
  onArrowUpKey: () => void
  onArrowDownKey: () => void
  rev?: string
  tooltip?: string
  type?: string
  users?: {
    name?: string
    email?: string
    imageUrl?: string
    id?: string
  }[]
  linkParams?: Record<string, unknown>
  linkComponent?: React.ComponentType<{
    params: Record<string, unknown>
  }>
}
export default class HistoryListItem extends React.PureComponent<HistoryListItemProps> {
  static defaultProps: {
    status: string
    title: any
    onSelect: () => any
    onEnterKey: () => any
    onArrowUpKey: () => any
    onArrowDownKey: () => any
    isCurrentVersion: boolean
    isSelected: boolean
    users: any[]
    children: any
    rev: any
    linkParams: any
    linkComponent: any
  }
  _rootElement: React.RefObject<HTMLDivElement>
  componentDidUpdate(prevProps: any): void
  focus(): void
  handleKeyUp: (event: React.KeyboardEvent<HTMLDivElement>) => void
  handleKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
  handleSelect: (evt: React.MouseEvent<HTMLDivElement>) => void
  render(): JSX.Element
}
export {}
