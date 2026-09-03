import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {hotspotImageContainer} from './HotspotImage.css'

export function HotspotImageContainer(props: ComponentProps<'div'>) {
  const {className, ...rest} = props
  return <div {...rest} className={clsx(hotspotImageContainer, className)} />
}
