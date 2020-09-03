import React from 'react'
import {isElement} from 'react-is'

import styles from './avatarStack.css'

interface AvatarStackProps {
  children: React.ReactNode
  maxLength?: number
}

export function AvatarStack({children: childrenProp, maxLength = 4}: AvatarStackProps) {
  const children = childrenToElementArray(childrenProp)
  const len = children.length
  const visibleCount = maxLength - 1
  const extraCount = len - visibleCount
  const visibleChildren = extraCount > 1 ? children.slice(extraCount, len) : children

  return (
    <>
      <div className={styles.root}>
        {extraCount > 1 && (
          <div className={styles.extraCounter}>
            <span>{extraCount}</span>
          </div>
        )}
        {visibleChildren.map((child, childIndex) => {
          return <div key={childIndex}>{child}</div>
        })}
      </div>
    </>
  )
}

function childrenToElementArray(children: React.ReactNode): React.ReactElement[] {
  const childrenArray = Array.isArray(children) ? children : [children]

  return childrenArray.filter(isElement)
}
