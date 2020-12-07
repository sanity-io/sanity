import {Layer, Portal} from '@sanity/ui'
import classNames from 'classnames'
import SpinnerIcon from 'part:@sanity/base/spinner-icon'
import styles from 'part:@sanity/components/loading/spinner-style'
import React from 'react'
import {useZIndex} from '../../../../components'

interface SpinnerProps {
  center?: boolean
  delay?: number // delay in ms
  fullscreen?: boolean
  inline?: boolean
  message?: string
}

export default function Spinner(props: SpinnerProps & React.HTMLProps<HTMLDivElement>) {
  const {
    className: classNameProp,
    inline,
    message,
    fullscreen,
    center,
    delay = 300,
    children,
    style = {},
    ...restProps
  } = props

  const zindex = useZIndex()

  const className = classNames(
    inline ? styles.inline : styles.block,
    fullscreen && styles.fullscreen,
    center && styles.center,
    classNameProp
  )

  const rootStyle = {
    ...style,
    animationDelay: `${delay}ms`,
  }

  const root = (
    <div {...restProps} className={className} style={rootStyle}>
      <div className={styles.inner}>
        <span className={styles.iconContainer}>
          <SpinnerIcon />
        </span>

        {/* @todo: Wrap in a container */}
        {children}

        {!children && message && <div className={styles.message}>{message}</div>}
      </div>
    </div>
  )

  if (fullscreen) {
    return (
      <Portal>
        <Layer className={styles.fullscreenLayer} zOffset={zindex.portal}>
          {root}
        </Layer>
      </Portal>
    )
  }

  return root
}
