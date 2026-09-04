import {ElementQuery} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {dateWithTooltipElementQuery} from './DateWithTooltipElementQuery.css'

function DateWithTooltipElementQuery(props: ComponentProps<typeof ElementQuery>) {
  const {className, ...rest} = props

  return <ElementQuery {...rest} className={clsx(dateWithTooltipElementQuery, className)} />
}

export default DateWithTooltipElementQuery
