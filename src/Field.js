import styles from './styles/Field.css'

import React, {PropTypes} from 'react'

export default function Field(props) {
  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <label className={styles.label}>
          {props.label}
        </label>
        {props.children}
      </div>
    </div>
  )
}

Field.propTypes = {
  children: PropTypes.node,
  role: PropTypes.string,
  title: PropTypes.string
}
