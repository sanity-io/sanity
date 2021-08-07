import React from 'react'
interface StackedExampleProps {
  onEscape: (event: KeyboardEvent) => void
  children: React.ReactNode
}
declare function StackedEscapable(props: StackedExampleProps): JSX.Element
export default StackedEscapable
