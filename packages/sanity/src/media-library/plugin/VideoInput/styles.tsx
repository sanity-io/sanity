import {Card} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {ratioBox, ratioBoxPortrait} from './styles.css'

export function RatioBox(props: ComponentProps<typeof Card> & {$isPortrait?: boolean}) {
  const {$isPortrait, className, ...rest} = props

  return <Card {...rest} className={clsx(ratioBox, $isPortrait && ratioBoxPortrait, className)} />
}
