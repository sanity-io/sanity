import React, {PropTypes} from 'react'
import Pane from './pane/Pane'
import styles from '../styles/DeskTool.css'
import resolvePanes from 'config:desk-tool/pane-resolver'
import locationStore from 'datastore:@sanity/base/location'

class DeskTool extends React.Component {
  constructor() {
    super()
    this.state = {}
  }

  componentDidMount() {
    this.subscription = locationStore.state.subscribe({
      next: ev => this.setState({location: ev.location})
    })
  }

  componentWillUnmount() {
    this.subscription.unsubscribe()
  }

  render() {
    const {location} = this.state
    if (!location) {
      return null
    }

    const parts = location.pathname.split('/')
    const [, site, tool] = parts
    const basePath = `/${site}/${tool}`
    const segments = parts.slice(3)

    return (
      <div className={styles.panesContainer}>
        <nav>
          {resolvePanes(segments)}
        </nav>
        <main>
          Desk tool content to edit here
        </main>
      </div>
    )
  }
}

DeskTool.contextTypes = {
  router: PropTypes.object
}

export default DeskTool
