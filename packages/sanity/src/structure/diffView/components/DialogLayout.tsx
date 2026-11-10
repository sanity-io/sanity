import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {dialogLayout} from './DialogLayout.css'

export function DialogLayout(props: ComponentProps<'div'>) {
  const {className, ...rest} = props
  return <div {...rest} className={clsx(dialogLayout, className)} />
}
