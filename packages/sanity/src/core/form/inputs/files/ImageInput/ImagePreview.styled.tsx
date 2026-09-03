import {Card, Flex} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {errorIconWrapper, flexOverlay, overlay, ratioBox} from './ImagePreview.css'

export function RatioBox(props: ComponentProps<typeof Card>) {
  const {className, ...rest} = props
  return <Card {...rest} className={clsx(ratioBox, className)} />
}

export function Overlay(props: ComponentProps<typeof Card>) {
  const {className, ...rest} = props
  return <Card {...rest} className={clsx(overlay, className)} />
}

export function FlexOverlay(props: ComponentProps<typeof Flex>) {
  const {className, ...rest} = props
  return <Flex {...rest} className={clsx(flexOverlay, className)} />
}

export function ErrorIconWrapper(props: ComponentProps<'div'>) {
  const {className, ...rest} = props
  return <div {...rest} className={clsx(errorIconWrapper, className)} />
}
