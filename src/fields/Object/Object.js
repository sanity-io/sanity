import styles from './styles/Object.css'
import React, {PropTypes} from 'react'
import Fieldset from '../../Fieldset'

export default function ObjectField(props) {
  const {input, field, level} = props

  const {title, ...rest} = field

  const fieldset = {
    legend: title, // Use field title as legend
    ...rest
  }

  return (
    <div className={styles.root}>
      <Fieldset fieldset={fieldset} level={level}>
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
