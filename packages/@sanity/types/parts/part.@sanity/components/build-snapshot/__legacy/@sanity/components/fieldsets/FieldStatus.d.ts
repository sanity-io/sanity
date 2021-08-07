import React from 'react'
interface FieldStatusProps {
  children?: React.ReactNode
  maxAvatars?: number
  position?: 'top' | 'bottom'
}
export default function FieldStatus({children, maxAvatars, position}: FieldStatusProps): JSX.Element
export {}
