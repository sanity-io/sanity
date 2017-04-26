import React from 'react'
import styles from './styles/DeskTool.css'
import SchemaPaneResolver from './SchemaPaneResolver'

export default class DeskTool extends React.Component {
  render() {
    return (
      <div className={styles.deskTool}>
        <SchemaPaneResolver />
      </div>
    )
  }
}
