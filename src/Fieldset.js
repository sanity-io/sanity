import styles from './styles/Fieldset.css'

import React, {PropTypes} from 'react'

export default function Fieldset(props) {

  let className = styles.root

  if (props.level > 0) {
    className = styles[`level_${props.level}`]
  }

  return (
    <fieldset className={className} style={{outline: '1px solid #ee00ee'}}>
      <div className={styles.inner}>
        <span style={{float: 'right'}}>[fieldset on nesting level {props.level}]</span>
        <legend className={styles.legend}>{props.legend}</legend>
        <div className={styles.content}>
          {props.children}
        </div>
      </div>
    </fieldset>
  )
}

Fieldset.propTypes = {
  title: PropTypes.string,
  legend: PropTypes.string,
  children: PropTypes.node,
  level: PropTypes.number
}
