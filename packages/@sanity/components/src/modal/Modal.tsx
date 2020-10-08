import classNames from 'classnames'
import React from 'react'
import {Portal} from '../portal'
import {useModal} from './hooks'
import {ModalProvider} from './ModalProvider'

import styles from './Modal.module.css'

const INITIAL_Z_INDEX = 1060

export function Modal(props: React.HTMLProps<HTMLDivElement>) {
  return (
    <ModalProvider>
      <Portal>
        <ModalChildren {...props} />
      </Portal>
    </ModalProvider>
  )
}

function ModalChildren({children, className, ...restProps}: React.HTMLProps<HTMLDivElement>) {
  const modal = useModal() || {depth: 0}

  return (
    <div
      {...restProps}
      className={classNames(styles.root, className)}
      style={{zIndex: INITIAL_Z_INDEX + modal.depth}}
    >
      {children}
    </div>
  )
}
