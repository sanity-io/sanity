import {color, number} from 'part:@sanity/storybook/addons/knobs'
import React from 'react'

import styles from './container.css'

export function Container({as: asProp, children}) {
  const backgroundColor = color('View color', 'rgba(255, 255, 255, 1', 'test')
  const fontSize = number('Font size (rem)', 1, {range: true, min: 0.5, max: 3, step: 0.25})

  return React.createElement(
    asProp || 'div',
    {className: styles.root, style: {backgroundColor, fontSize: `${fontSize}rem`}},
    children
  )
}
