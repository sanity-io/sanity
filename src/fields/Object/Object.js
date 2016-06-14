import styles from './styles/Object.css'
import React, {PropTypes} from 'react'
import Fieldset from '../../Fieldset.js'

export default function ObjectField(props) {
  const {input, field, level} = props
  return (
    <div className={styles.root}>
      <Fieldset level={level} description={field.description}>
        <div className={styles.inner}>
          {input}
        </div>
      </Fieldset>
    </div>
  )
}

ObjectField.propTypes = {
  input: PropTypes.node,
  level: PropTypes.number,
  fieldName: PropTypes.string,
  field: PropTypes.shape({
    title: PropTypes.string
  })
}
