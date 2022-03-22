import type React from 'react'
interface Props {
  children?: React.ReactNode
  color?: 'success' | 'warning' | 'danger'
  icon?: React.ComponentType
  title?: React.ReactNode
}
export default function Alert(props: Props): JSX.Element
export {}
