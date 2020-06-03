import classNames from 'classnames'
import {color, number} from 'part:@sanity/storybook/addons/knobs'
import React from 'react'

import styles from './centeredContainer.css'

export function CenteredContainer({children, className: classNameProp, style, ...restProps}) {
  const backgroundColor = color('View color', 'rgba(255, 255, 255, 0', 'test')
  const fontSize = number('Font size (rem)', 1, {range: true, min: 0.5, max: 3, step: 0.25})
  const className = classNames(styles.root, classNameProp)

  return (
    <div
      {...restProps}
      className={className}
      style={{backgroundColor, fontSize: `${fontSize}rem`, ...(style || {})}}
    >
      {children}
    </div>
  )
}
