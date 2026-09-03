import {Card} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {variantSet} from './VariantSet.css'

export function VariantSet(props: ComponentProps<typeof Card>) {
  const {className, ...rest} = props

  // `border` and `radius` were `.attrs()` on the original, which take precedence over props
  return <Card {...rest} border radius={3} className={clsx(variantSet, className)} />
}
