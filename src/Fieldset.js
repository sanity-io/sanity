import styles from './styles/Fieldset.css'

import React, {PropTypes} from 'react'

export default function Fieldset(props) {
  return (
    <fieldset className={styles.root}>
      <div className={styles.inner}>
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
  children: PropTypes.node
}
