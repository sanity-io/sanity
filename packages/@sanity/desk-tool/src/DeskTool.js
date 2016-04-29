import React, {PropTypes} from 'react'
import styles from 'style:desk-tool/styles'
import PaneResolver from 'config:desk-tool/pane-resolver'

function DeskTool({location}) {
  const segments = location.pathname.split('/').slice(1)

  return <PaneResolver segments={segments} />
}

export default DeskTool
