import classNames from 'classnames'
import React from 'react'

import styles from './CodeBlock.css'

export function CodeBlock({children, className, ...restProps}: React.HTMLProps<HTMLPreElement>) {
  return (
    <pre {...restProps} className={classNames(styles.root, className)}>
      <code>{children}</code>
    </pre>
  )
}
