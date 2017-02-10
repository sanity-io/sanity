import React, {PropTypes} from 'react'
import styles from '../styles/contentStyles/Header.css'

function Header(props) {
  return (
    <div {...props.attributes} className={styles[`heading${props.level}`]}>
      {props.children}
    </div>
  )
}

Header.propTypes = {
  attributes: PropTypes.object,
  level: PropTypes.number,
  children: PropTypes.node
}

export default Header
