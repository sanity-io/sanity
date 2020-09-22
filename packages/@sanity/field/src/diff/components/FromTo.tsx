import classNames from 'classnames'
import React, {forwardRef} from 'react'
import {FromToArrow} from './FromToArrow'

import styles from './FromTo.css'

export interface FromToProps {
  align?: 'top' | 'center' | 'bottom'
  layout?: 'grid' | 'inline'
  from?: React.ReactNode
  to?: React.ReactNode
}

export const FromTo = forwardRef(
  (
    {
      align = 'top',
      className,
      layout = 'inline',
      from,
      to,
      ...restProps
    }: FromToProps & Omit<React.HTMLProps<HTMLDivElement>, 'children'>,
    ref
  ) => {
    return (
      <div
        {...restProps}
        className={classNames(styles.root, className)}
        data-from-to-align={align}
        data-from-to-layout={layout}
        ref={ref as any}
      >
        <div className={styles.column}>{from}</div>
        <FromToArrow className={styles.arrow} />
        <div className={styles.column}>{to}</div>
      </div>
    )
  }
)

FromTo.displayName = 'FromTo'
