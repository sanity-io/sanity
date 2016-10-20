import React, {PropTypes} from 'react'
import styles from '../styles/Mark.css'

function Mark(props) {
  return <span className={styles[props.mark.type]}>{props.children}</span>
}

Mark.propTypes = {
  mark: PropTypes.shape({
    type: PropTypes.string
  }),
  children: PropTypes.node
}

export default Mark
