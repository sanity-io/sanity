import React, {PropTypes} from 'react'
import styles from '../styles/DeskTool.css'
import PaneResolver from 'config:desk-tool/pane-resolver'

function DeskTool({location}) {
  const segments = location.pathname.split('/').slice(1)

  return (
    <div className={styles.deskTool}>
      <PaneResolver segments={segments} />
    </div>
  )
}

export default DeskTool
