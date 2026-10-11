import {Layer} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {overlay} from './styles.css'

export function Overlay(props: ComponentProps<typeof Layer>) {
  const {className, ...rest} = props
  return <Layer {...rest} className={clsx(overlay, className)} />
}
