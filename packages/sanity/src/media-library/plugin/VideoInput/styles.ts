import {Card, type CardProps} from '@sanity/ui'
import {type ComponentProps, forwardRef} from 'react'

import {ratioBox, ratioBoxPortrait} from './styles.css'

export const RatioBox = forwardRef<HTMLDivElement, CardProps & {$isPortrait?: boolean}>(
  function RatioBox({$isPortrait, ...props}, ref) {
    return (
      <Card
        {...props}
        className={$isPortrait ? ratioBoxPortrait : ratioBox}
        ref={ref}
      />
    )
  },
)
