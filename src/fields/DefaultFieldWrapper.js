import styles from './styles/Field.css'

import React, {PropTypes} from 'react'

export default function Field(props) {
  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <span style={{float: 'right'}}>[field on nesting level {props.level}]</span>
        <label className={styles.label}>
          {props.field.title}
        </label>
        {props.children}
      </div>
    </div>
  )
}

Field.propTypes = {
  children: PropTypes.node,
  role: PropTypes.string,
  level: PropTypes.number,
  label: PropTypes.string,
  title: PropTypes.string
}
