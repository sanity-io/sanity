import React from 'react'
interface ToggleButtonItem {
  icon?: React.ComponentType<Record<string, unknown>>
  title?: string
}
interface ToggleButtonsProps {
  label?: string
  onChange?: (item: ToggleButtonItem) => void
  value?: ToggleButtonItem
  items?: ToggleButtonItem[]
}
export default class ToggleButtons extends React.Component<ToggleButtonsProps> {
  handleClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  render(): JSX.Element
}
export {}
