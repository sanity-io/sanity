import styles from './styles/Fieldset.css'
import React, {PropTypes} from 'react'

export default function Fieldset(props) {

  let className = styles.root

  if (props.level > 0) {
    className = styles[`level_${props.level}`]
  }

  return (
    <fieldset className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.nestingLevel}>Fieldset, nesting level {props.level}</div>
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
