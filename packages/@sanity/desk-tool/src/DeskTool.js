import React, {PropTypes} from 'react'
import styles from './styles/DeskTool.css'
import PaneResolver from 'part:@sanity/desk-tool/pane-resolver'

export default class DeskTool extends React.Component {
  render() {
    return (
      <div className={styles.deskTool}>
        <PaneResolver />
      </div>
    )
  }
}
