import {Inline} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {menuActionsWrapper} from './MenuActionsWrapper.css'

export function MenuActionsWrapper(props: ComponentProps<typeof Inline>) {
  const {className, ...rest} = props
  return <Inline {...rest} className={clsx(menuActionsWrapper, className)} />
}
