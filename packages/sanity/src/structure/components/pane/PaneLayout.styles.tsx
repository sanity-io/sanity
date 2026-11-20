import {Card} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {root} from './PaneLayout.styles.css'

export function Root(props: ComponentProps<typeof Card>) {
  const {className, ...rest} = props
  return <Card {...rest} className={clsx(root, className)} />
}
