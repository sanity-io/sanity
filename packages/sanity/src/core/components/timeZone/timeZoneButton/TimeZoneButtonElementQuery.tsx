import {ElementQuery} from '@sanity/ui'
import {type ReactNode} from 'react'

import {timeZoneButtonElementQuery} from './TimeZoneButtonElementQuery.css'

const TimeZoneButtonElementQuery = ({children, ...props}: {children?: ReactNode} & Record<string, unknown>) => (
  <ElementQuery className={timeZoneButtonElementQuery} {...props}>
    {children}
  </ElementQuery>
)

export default TimeZoneButtonElementQuery
