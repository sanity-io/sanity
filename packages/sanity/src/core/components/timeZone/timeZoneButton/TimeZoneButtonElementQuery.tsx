import {ElementQuery} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {timeZoneButtonElementQuery} from './TimeZoneButtonElementQuery.css'

function TimeZoneButtonElementQuery(props: ComponentProps<typeof ElementQuery>) {
  const {className, ...rest} = props

  return <ElementQuery {...rest} className={clsx(timeZoneButtonElementQuery, className)} />
}

export default TimeZoneButtonElementQuery
