import React, {PropTypes} from 'react'
import styles from '../styles/Header.css'

function Header(props) {
  return (
    <div className={styles[`header-${props.level}`]}>
      {props.children}
    </div>
  )
}

Header.propTypes = {
  level: PropTypes.number,
  children: PropTypes.node
}

export default Header
