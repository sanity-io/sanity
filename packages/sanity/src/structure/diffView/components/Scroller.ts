import {type CSSProperties, type ForwardedRef, forwardRef, type HTMLProps, createElement} from 'react'

import {scroller} from './Scroller.css'

export const Scroller = forwardRef(function Scroller(
  props: HTMLProps<HTMLDivElement>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {className, ...rest} = props
  return createElement('div', {
    ...rest,
    className: className ? `${scroller} ${className}` : scroller,
    ref,
  })
})
