import styles from './styles/FieldsetField.css'

import React, {PropTypes} from 'react'

// Field renderer for boolean fields
export default function Field(props) {
  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <label className={styles.title}>
          This is the field title
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
