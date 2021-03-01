import classNames from 'classnames'
import React from 'react'

import styles from './FromToArrow.css'

export const FromToArrow = ({
  className,
  ...restProps
}: Omit<React.HTMLProps<HTMLDivElement>, 'children'>) => (
  <div {...restProps} className={classNames(styles.root, className)}>
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 8.5L12 8.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 5.5L12 8.5L9 11.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  </div>
)
