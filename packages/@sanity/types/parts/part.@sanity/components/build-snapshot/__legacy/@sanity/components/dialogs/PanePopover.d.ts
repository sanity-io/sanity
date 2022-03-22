import type React from 'react'
interface PanePopoverProps {
  children?: React.ReactNode
  icon?: React.ReactNode | boolean
  kind?: 'info' | 'warning' | 'error' | 'success' | 'neutral'
  title: string | React.ReactNode
  subtitle?: string | React.ReactNode
  id: string | number
}
export default class PanePopover extends React.PureComponent<PanePopoverProps> {
  iconKind: () => any
  render(): JSX.Element
}
export {}
