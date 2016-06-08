import styles from './styles/Default.css'

import React, {PropTypes} from 'react'
import DefaultFieldWrapper from './DefaultFieldWrapper'

export default function DefaultField(props) {
  const {input} = props
  return (
    <DefaultFieldWrapper {...props}>
      <div className={styles.root}>
        <div className={styles.formControl}>
          {input}
        </div>
      </div>
    </DefaultFieldWrapper>
  )
}

DefaultField.propTypes = {
  input: PropTypes.node,
  fieldName: PropTypes.string,
  field: PropTypes.shape({
    title: PropTypes.string
  })
}
