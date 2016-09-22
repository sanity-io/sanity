import React, {PropTypes} from 'react'
import styles from './styles/PaneContainer.css'

const PaneContainer = ({children}) =>
  <nav className={styles.root}>
    {children}
  </nav>

PaneContainer.propTypes = {
  children: PropTypes.node
}

export default PaneContainer
