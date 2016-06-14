import styles from './styles/Fieldset.css'
import React, {PropTypes} from 'react'

export default function Fieldset(props) {
  console.log("Fieldset props", props)
  return (
    <fieldset className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.debugNestingLevel}>Fieldset, nesting level {props.level}</div>
        <legend className={styles.legend}>{props.legend}</legend>
        <p className={styles.description}>
          {props.description}
        </p>
        <div className={styles.content}>
          {props.children}
        </div>
      </div>
    </fieldset>
  )
}

Fieldset.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  legend: PropTypes.string,
  children: PropTypes.node,
  level: PropTypes.number
}
