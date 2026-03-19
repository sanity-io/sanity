import {Card, type CardProps} from '@sanity/ui'
import {forwardRef, type HTMLProps} from 'react'

import {ratioBox, ratioBoxPortrait} from './styles.css'

type CardComponentProps = CardProps & Omit<HTMLProps<HTMLDivElement>, 'height' | 'as' | 'ref'>

export const RatioBox = forwardRef<HTMLDivElement, CardComponentProps & {$isPortrait?: boolean}>(
  function RatioBox({$isPortrait, ...props}, ref) {
    return <Card {...props} className={$isPortrait ? ratioBoxPortrait : ratioBox} ref={ref} />
  },
)
