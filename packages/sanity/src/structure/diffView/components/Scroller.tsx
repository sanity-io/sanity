import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {scroller} from './Scroller.css'

export function Scroller(props: ComponentProps<'div'>) {
  const {className, ...rest} = props
  return <div {...rest} className={clsx(scroller, className)} />
}
