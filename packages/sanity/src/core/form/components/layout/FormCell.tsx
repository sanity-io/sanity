import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {formCell} from './FormCell.css'
import {type FormArea} from './FormRow'

interface Props {
  $area: FormArea
}

/**
 * @internal
 */
export function FormCell(props: Props & ComponentProps<'div'>) {
  const {$area, className, ...rest} = props

  return <div {...rest} className={clsx(formCell[$area], className)} />
}
