import React from 'react'
interface TabProps {
  'aria-controls': string
  id: string
  icon?: React.ComponentType<Record<string, unknown>>
  isActive?: boolean
  isFocused?: boolean
  label: React.ReactNode
  onClick: () => void
  onFocus?: () => void
}
interface State {
  isDOMFocused: boolean
}
export default class Tab extends React.PureComponent<TabProps, State> {
  element: HTMLButtonElement | null
  focusTimeout?: number
  constructor(props: TabProps)
  componentDidUpdate(prevProps: TabProps): void
  componentWillUnmount(): void
  handleBlur: () => void
  handleFocus: () => void
  setElement: (element: HTMLButtonElement | null) => void
  render(): JSX.Element
}
export {}
