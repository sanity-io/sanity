import classNames from 'classnames'
import React, {cloneElement} from 'react'
import {childrenToElementArray} from '../helpers'
import {AvatarCounter} from './avatarCounter'
import {AvatarSize} from './types'

import styles from './avatarStack.css'

interface AvatarStackProps {
  children: React.ReactNode
  maxLength?: number
  size?: AvatarSize
  tone?: 'navbar'
}

export function AvatarStack(props: AvatarStackProps & React.HTMLProps<HTMLDivElement>) {
  const {
    children: childrenProp,
    className,
    maxLength: maxLengthProp = 4,
    size = 'small',
    tone,
    ...restProps
  } = props
  const maxLength = Math.max(maxLengthProp, 0)
  const children = childrenToElementArray(childrenProp)
  const len = children.length
  const visibleCount = maxLength - 1
  const extraCount = len - visibleCount
  const visibleChildren = extraCount > 1 ? children.slice(extraCount, len) : children

  return (
    <>
      <div {...restProps} className={classNames(styles.root, className)} data-size={size}>
        {len === 0 && (
          <div>
            <AvatarCounter count={len} tone={tone} />
          </div>
        )}

        {len !== 0 && extraCount > 1 && (
          <div>
            <AvatarCounter count={extraCount} size={size} tone={tone} />
          </div>
        )}

        {visibleChildren.map((child, childIndex) => (
          <div key={String(childIndex)}>{cloneElement(child, {size, tone})}</div>
        ))}
      </div>
    </>
  )
}
