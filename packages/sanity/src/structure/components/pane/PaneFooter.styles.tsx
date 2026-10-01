import {Card, Layer} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {root, rootCard} from './PaneFooter.styles.css'

export function Root(props: ComponentProps<typeof Layer>) {
  const {className, ...rest} = props
  return <Layer {...rest} className={clsx(root, className)} />
}

export function RootCard(props: ComponentProps<typeof Card>) {
  const {className, ...rest} = props
  return <Card {...rest} className={clsx(rootCard, className)} />
}
