import {type ReactNode} from 'react'

import {formCellArea} from './FormCell.css'
import {type FormArea} from './FormRow'

interface Props {
  $area: FormArea
  children?: ReactNode
}

/**
 * @internal
 */
export function FormCell({$area, children}: Props) {
  return <div className={formCellArea[$area]}>{children}</div>
}
