import {ElementQuery} from '@sanity/ui'
import {forwardRef, type ComponentProps} from 'react'

import {timeZoneButtonElementQuery} from './TimeZoneButtonElementQuery.css'

const TimeZoneButtonElementQuery = forwardRef<HTMLDivElement, ComponentProps<typeof ElementQuery>>(
  function TimeZoneButtonElementQuery({className, ...props}, ref) {
    return (
      <ElementQuery
        ref={ref}
        className={[timeZoneButtonElementQuery, className].filter(Boolean).join(' ')}
        {...props}
      />
    )
  },
)

export default TimeZoneButtonElementQuery
