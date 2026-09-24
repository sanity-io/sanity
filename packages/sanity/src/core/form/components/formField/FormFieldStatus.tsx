import {type ReactNode} from 'react'

import {root} from './FormFieldStatus.css'

/** @internal */
export interface FieldStatusProps {
  children?: ReactNode
  maxAvatars?: number
  position?: 'top' | 'bottom'
}

/** @internal */
export function FormFieldStatus({children, maxAvatars, position = 'bottom'}: FieldStatusProps) {
  return (
    <div className={root} data-max-avatars={maxAvatars} data-position={position}>
      {children}
    </div>
  )
}
