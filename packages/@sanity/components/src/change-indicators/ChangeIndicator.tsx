import React from 'react'
import styles from './ChangeIndicator.css'
import {Context} from './context'

export function ChangeIndicator(props: {children?: React.ReactNode}) {
  const context = React.useContext(Context)

  return <div className={context.isChanged ? styles.inputWrapper : null}>{props.children}</div>
}
