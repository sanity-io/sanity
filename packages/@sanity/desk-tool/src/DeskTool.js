import React, {PropTypes} from 'react'
import styles from '../styles/DeskTool.css'
import PaneResolver from 'config:desk-tool/pane-resolver'
import ActionButton from 'component:@sanity/base/action-button?'
import schema from 'schema:@sanity/base/schema'

function DeskTool() {
  const actions = (schema.types || []).map(type => ({
    nextState: {selectedType: type.name, action: 'create', selectedDocumentId: `${type.name}:`},
    title: type.name.substr(0, 1).toUpperCase() + type.name.substring(1)
  }))

  return (
    <div className={styles.deskTool}>
      <PaneResolver />
      {ActionButton && <ActionButton actions={actions} />}
    </div>
  )
}

DeskTool.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired
  })
}

export default DeskTool
