import classNames from 'classnames'
import React, {forwardRef} from 'react'
import {FromToArrow} from './FromToArrow'

import styles from './FromTo.css'

export type FromToProps = {
  align?: 'top' | 'center' | 'bottom'
  layout?: 'grid' | 'inline'
  from?: React.ReactNode
  to?: React.ReactNode
} & Omit<React.HTMLProps<HTMLDivElement>, 'children'>

export const FromTo = forwardRef<HTMLDivElement, FromToProps>(
  ({align = 'top', className, layout = 'inline', from, to, ...restProps}, ref) => {
    return (
      <div
        {...restProps}
        className={classNames(styles.root, className)}
        data-from-to-align={align}
        data-from-to-layout={layout}
        ref={ref}
      >
        {from && (
          <>
            <div className={styles.column}>{from}</div>
            <FromToArrow className={styles.arrow} />
          </>
        )}
        <div className={styles.column}>{to}</div>
      </div>
    )
  }
)

FromTo.displayName = 'FromTo'
