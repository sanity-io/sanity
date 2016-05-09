import React, {PropTypes} from 'react'
import styles from '../styles/DeskTool.css'
import PaneResolver from 'config:desk-tool/pane-resolver'

function DeskTool({location}) {
  return (
    <div className={styles.deskTool}>
      <PaneResolver location={location.pathname} />
    </div>
  )
}

DeskTool.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired
  })
}

export default DeskTool
