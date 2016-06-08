import styles from './styles/Fieldset.css'

import React, {PropTypes} from 'react'

export default function Fieldset(props) {
  return (
    <fieldset className={styles.root} style={{outline: '1px solid #ee00ee'}}>
      <div className={styles.inner}>
        [fieldset on nesting level {props.level}]
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
