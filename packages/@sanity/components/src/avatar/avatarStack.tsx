/* eslint-disable react/require-default-props */

import React, {cloneElement} from 'react'
import {isElement} from 'react-is'
import {AvatarCounter} from './avatarCounter'
import {AvatarSize} from './types'

import styles from './avatarStack.css'

interface AvatarStackProps {
  children: React.ReactNode
  maxLength?: number
  size?: AvatarSize
  tone?: 'navbar'
}

export function AvatarStack(props: AvatarStackProps) {
  const {children: childrenProp, maxLength: maxLengthProp = 4, size = 'small', tone} = props
  const maxLength = Math.max(maxLengthProp, 0)
  const children = childrenToElementArray(childrenProp)
  const len = children.length
  const visibleCount = maxLength - 1
  const extraCount = len - visibleCount
  const visibleChildren = extraCount > 1 ? children.slice(extraCount, len) : children

  return (
    <>
      <div className={styles.root} data-size={size}>
        {len === 0 && (
          <div>
            <AvatarCounter count={len} />
          </div>
        )}

        {len !== 0 && extraCount > 1 && (
          <div>
            <AvatarCounter count={extraCount} size={size} />
          </div>
        )}

        {visibleChildren.map((child, childIndex) => (
          <div key={String(childIndex)}>{cloneElement(child, {size, tone})}</div>
        ))}
      </div>
    </>
  )
}

function childrenToElementArray(children: React.ReactNode): React.ReactElement[] {
  const childrenArray = Array.isArray(children) ? children : [children]

  return childrenArray.filter(isElement)
}
