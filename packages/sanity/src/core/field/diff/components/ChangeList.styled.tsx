import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {changeListWrapper} from './ChangeList.css'

export function ChangeListWrapper(props: ComponentProps<'div'>) {
  const {className, ...rest} = props

  return <div {...rest} className={clsx(changeListWrapper, className)} />
}
