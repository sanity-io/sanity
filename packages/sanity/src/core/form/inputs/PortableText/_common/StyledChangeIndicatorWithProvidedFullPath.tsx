import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {ChangeIndicator} from '../../../../changeIndicators/ChangeIndicator'
import {root} from './StyledChangeIndicatorWithProvidedFullPath.css'

export function StyledChangeIndicatorWithProvidedFullPath(
  props: ComponentProps<typeof ChangeIndicator>,
) {
  const {className, ...rest} = props
  return <ChangeIndicator {...rest} className={clsx(root, className)} />
}
