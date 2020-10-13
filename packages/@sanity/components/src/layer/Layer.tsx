import classNames from 'classnames'
import React from 'react'
import {Portal} from '../portal'
import {useLayer} from './hooks'
import {LayerProvider} from './LayerProvider'

import styles from './Layer.module.css'

const INITIAL_Z_INDEX = 1060

export function Layer(props: React.HTMLProps<HTMLDivElement>) {
  return (
    <LayerProvider>
      <Portal>
        <LayerChildren {...props} />
      </Portal>
    </LayerProvider>
  )
}

function LayerChildren({
  children,
  className,
  style = {},
  ...restProps
}: React.HTMLProps<HTMLDivElement>) {
  const layer = useLayer()

  return (
    <div
      {...restProps}
      className={classNames(styles.root, className)}
      style={{...style, zIndex: INITIAL_Z_INDEX + layer.depth}}
    >
      {children}
    </div>
  )
}
