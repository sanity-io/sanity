import {Card, Flex} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {
  cardContainer,
  contentContainer,
  flexContainer,
  overlayContainer,
} from './ActivateOnFocus.css'

export function OverlayContainer(props: ComponentProps<'div'>) {
  const {className, ...rest} = props
  return <div {...rest} className={clsx(overlayContainer, className)} />
}

export function ContentContainer(props: ComponentProps<'div'>) {
  const {className, ...rest} = props
  return <div {...rest} className={clsx(contentContainer, className)} />
}

export function CardContainer(props: ComponentProps<typeof Card>) {
  const {className, ...rest} = props
  return <Card {...rest} className={clsx(cardContainer, className)} />
}

export function FlexContainer(props: ComponentProps<typeof Flex>) {
  const {className, ...rest} = props
  return <Flex {...rest} className={clsx(flexContainer, className)} />
}
