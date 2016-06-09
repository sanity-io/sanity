import styles from './styles/Object.css'

import React, {PropTypes} from 'react'
import Fieldset from '../../Fieldset.js'

export default function ObjectField(props) {
  const {input, field, level} = props
  return (
    <Fieldset level={level} className={styles.root} legend={field.title || 'No legend is set'}>
      <div className={styles.inner}>
        {input}
      </div>
    </Fieldset>
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
