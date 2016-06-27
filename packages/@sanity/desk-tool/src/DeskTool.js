import React, {PropTypes} from 'react'
import styles from '../styles/DeskTool.css'
import PaneResolver from 'config:desk-tool/pane-resolver'
import ActionButton from 'component:@sanity/base/action-button?'
import schema from 'schema:@sanity/base/schema'
import config from 'config:sanity'

function DeskTool({location}) {
  const actions = (schema.types || []).map(type => ({
    url: `/${type.name}/${config.api.dataset}:`,
    title: type.name.substr(0, 1).toUpperCase() + type.name.substr(1)
  }))

  return (
    <div className={styles.deskTool}>
      <PaneResolver location={location.pathname} />

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
