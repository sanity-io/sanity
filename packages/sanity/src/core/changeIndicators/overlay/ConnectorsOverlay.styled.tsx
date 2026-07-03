import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {svgWrapper} from './ConnectorsOverlay.css'

export function SvgWrapper(props: ComponentProps<'svg'>) {
  const {className, ...restProps} = props

  return <svg {...restProps} className={clsx(svgWrapper, className)} />
}
