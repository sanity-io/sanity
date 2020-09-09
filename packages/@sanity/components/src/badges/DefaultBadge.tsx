import React, {forwardRef} from 'react'

import styles from './DefaultBadge.css'

interface DefaultBadgeProps extends React.HTMLProps<HTMLSpanElement> {
  color?: 'success' | 'warning' | 'danger' | 'info'
}

const DefaultBadge = forwardRef((props: DefaultBadgeProps, ref: React.Ref<HTMLSpanElement>) => {
  const {color, children, ...restProps} = props

  return (
    <span {...restProps} className={styles.root} data-color={color} ref={ref}>
      {children}
    </span>
  )
})

DefaultBadge.displayName = 'DefaultBadge'

export default DefaultBadge
