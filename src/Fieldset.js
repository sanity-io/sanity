import styles from './styles/Fieldset.css'
import React, {PropTypes} from 'react'

export default function Fieldset(props) {
  const {fieldset} = props
  return (
    <fieldset className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.debugNestingLevel}>Fieldset, nesting level {props.level}</div>
        <legend className={styles.legend}>{fieldset.legend}</legend>
        <p className={styles.description}>
          {fieldset.description}
        </p>
        <div className={styles.content}>
          {props.children}
        </div>
      </div>
    </fieldset>
  )
}

Fieldset.defaultProps = {
  fieldset: {}
}

Fieldset.propTypes = {
  fieldset: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    legend: PropTypes.string
  }),
  children: PropTypes.node,
  level: PropTypes.number
}
