import {ElementQuery} from '@sanity/ui'
import {forwardRef, type ComponentProps} from 'react'

import {dateWithTooltipElementQuery} from './DateWithTooltipElementQuery.css'

const DateWithTooltipElementQuery: typeof ElementQuery = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof ElementQuery>
>(function DateWithTooltipElementQuery({className, ...props}, ref) {
  return (
    <ElementQuery
      ref={ref}
      className={[dateWithTooltipElementQuery, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}) as typeof ElementQuery

export default DateWithTooltipElementQuery
