import React from 'react'
import {Router, Route} from 'react-enroute'
import SelectType from './SelectType'
import Debug from 'debug'
import SchemaForm from './SchemaForm'
import styles from './styles/Main.css'

Debug.disable('*')
// Debug.enable('slate*')
if (process.env.DEBUG) {
  // Debug.enable('slate:*')
}

export default function Main() {
  return (
    <div className={styles.root} id="Sanity_Default_DeskTool_Editor_ScrollContainer">
      <Router location={document.location.pathname}>
        <Route path="/" component={SelectType} />
        <Route path="/:schemaName" component={SelectType} />
        <Route path="/:schemaName/:typeName" component={SchemaForm} />
      </Router>
    </div>
  )
}
