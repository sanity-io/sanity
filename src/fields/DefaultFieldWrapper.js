import styles from './styles/Field.css'

import React, {PropTypes} from 'react'

export default function Field(props) {
  let className = styles.root

  if (props.level > 0) {
    className = styles[`level_${props.level}`]
  }

  return (
    <div className={className}>
      <div className={styles.nestingLevel}>Field, nesting level {props.level}</div>
      <div className={styles.inner}>

        <label className={styles.label}>
          {props.field.title}
        </label>

        <div className={styles.content}>
          {props.children}
        </div>

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
