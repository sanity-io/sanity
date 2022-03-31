import React from 'react'
interface Props {
  buttons?: React.ReactNode
  children: React.ReactNode
  color?: 'info' | 'success' | 'warning' | 'danger'
  onClose?: () => void
  title: React.ReactNode
}
declare function FullscreenMessageDialog(props: Props): JSX.Element
export default FullscreenMessageDialog
