import {forwardRef} from 'react'

import {LazyTextInput} from './LazyTextInput'
import * as styles from './TimeInput.css'

export const TimeInput = forwardRef<HTMLInputElement, React.ComponentProps<typeof LazyTextInput>>(
  function TimeInput(props, ref) {
    return <LazyTextInput {...props} ref={ref} type="time" className={styles.timeInputStyle} />
  },
)
