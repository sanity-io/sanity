import {ElementQuery} from '@sanity/ui'
import {forwardRef} from 'react'

import * as styles from './TimeZoneButtonElementQuery.css'

const TimeZoneButtonElementQuery = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof ElementQuery>
>(function TimeZoneButtonElementQuery(props, ref) {
  return <ElementQuery {...props} ref={ref} className={styles.timeZoneButtonElementQueryStyle} />
})

export default TimeZoneButtonElementQuery
