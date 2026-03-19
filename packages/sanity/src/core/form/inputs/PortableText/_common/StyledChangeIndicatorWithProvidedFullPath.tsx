import {type ComponentProps} from 'react'

import {ChangeIndicator} from '../../../../changeIndicators/ChangeIndicator'
import {styledChangeIndicator} from './StyledChangeIndicatorWithProvidedFullPath.css'

export function StyledChangeIndicatorWithProvidedFullPath(
  props: ComponentProps<typeof ChangeIndicator>,
) {
  return <ChangeIndicator {...props} className={styledChangeIndicator} />
}
