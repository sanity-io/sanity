import React, {PropTypes} from 'react'
import styles from '../styles/Link.css'

function Link(props) {
  return (
    <a href={props.href} className={styles.root} target={props.target}>
      {props.children}
    </a>
  )
}

Link.propTypes = {
  href: PropTypes.string,
  target: PropTypes.string,
  children: PropTypes.node
}

export default Link
