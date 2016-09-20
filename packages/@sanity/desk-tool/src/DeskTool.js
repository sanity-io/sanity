import React, {PropTypes} from 'react'
import styles from '../styles/DeskTool.css'
import PaneResolver from 'part:@sanity/desk-tool/pane-resolver'
import ActionButton from 'part:@sanity/base/action-button?'
import schema from 'part:@sanity/base/schema'
import DataAspectsResolver from 'part:@sanity/data-aspects/resolver'

const dataAspects = new DataAspectsResolver(schema)

function DeskTool() {
  const actions = (dataAspects.getInferredTypes()).map(type => ({
    nextState: {selectedType: type.name, action: 'create', selectedDocumentId: `${type.name}:`},
    title: `Create ${dataAspects.getDisplayName(type.name)}`
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
