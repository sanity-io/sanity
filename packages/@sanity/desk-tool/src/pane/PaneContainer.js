import React, {PropTypes} from 'react'
import styles from './styles/PaneContainer.css'

const PaneContainer = ({children}) =>
  <div className={styles.root}>
    {children}
  </div>

PaneContainer.propTypes = {
  children: PropTypes.node
}

export default PaneContainer
