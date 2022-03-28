import type React from 'react'
interface DialogContentProps {
  size?: 'small' | 'medium' | 'large' | 'auto'
  padding?: 'none' | 'small' | 'medium' | 'large'
  children?: React.ReactNode
}
declare function DialogContent(props: DialogContentProps): JSX.Element
export default DialogContent
