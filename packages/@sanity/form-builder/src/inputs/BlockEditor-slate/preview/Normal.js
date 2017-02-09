import React, {PropTypes} from 'react'
import styles from '../styles/contentStyles/Normal.css'

function Normal(props) {
  return <p className={styles.root}>{props.children}</p>
}

Normal.propTypes = {
  children: PropTypes.node
}

export default Normal
