import classNames from 'classnames'
import {number, select} from 'part:@sanity/storybook/addons/knobs'
import React from 'react'

import styles from './centeredContainer.css'

export function CenteredContainer({children, className: classNameProp, style, ...restProps}) {
  const fontSize = number(
    'Font size (rem)',
    1,
    {range: true, min: 0.5, max: 3, step: 0.25},
    'Container'
  )
  const className = classNames(styles.root, classNameProp)
  const tone =
    select(
      'Background tone',
      {'': '(none)', component: 'Component', navbar: 'Navbar'},
      'component',
      'Container'
    ) || undefined

  return (
    <div
      {...restProps}
      className={className}
      data-tone={tone}
      style={{fontSize: `${fontSize}rem`, ...(style || {})}}
    >
      {children}
    </div>
  )
}
