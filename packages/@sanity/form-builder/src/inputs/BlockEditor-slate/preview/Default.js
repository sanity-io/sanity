import React, {PropTypes} from 'react'
import styles from '../styles/contentStyles/Default.css'

function Default(props) {
  return <p className={styles.root}>{props.children}</p>
}

Default.propTypes = {
  children: PropTypes.node
}

export default Default
