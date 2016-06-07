import styles from './styles/Group.css'

import React, {PropTypes} from 'react'

// Field renderer for boolean fields
export default function Fieldset(props) {
  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        {props.children}
      </div>
    </div>
  )
}

Fieldset.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node
}
