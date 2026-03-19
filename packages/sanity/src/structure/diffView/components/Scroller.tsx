import {type ForwardedRef, forwardRef, type HTMLProps} from 'react'

import {scroller} from './Scroller.css'

export const Scroller = forwardRef(function Scroller(
  props: HTMLProps<HTMLDivElement>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {className, ...rest} = props
  return <div {...rest} className={className ? `${scroller} ${className}` : scroller} ref={ref} />
})
