import type React from 'react'
interface EscapableProps {
  onEscape?: (event: KeyboardEvent) => void
  children?: React.ReactNode
}
export default class Escapable extends React.Component<EscapableProps> {
  removeListener?: () => void
  UNSAFE_componentWillMount(): void
  componentWillUnmount(): void
  handleKeyPress: (event: KeyboardEvent) => void
  render(): {}
}
export {}
