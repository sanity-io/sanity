import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {container} from './Container.css'

export function Container(props: ComponentProps<'div'>) {
  const {className, ref, ...rest} = props

  return <div {...rest} className={clsx(container, className)} ref={ref} />
}
