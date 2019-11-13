/* eslint-disable no-console */
/* eslint-disable prefer-template */
import PropTypes from 'prop-types'
import React from 'react'
import studioHintsConfig from 'part:@sanity/studio-hints/config?'
import StudioHintsComponents from 'part:@sanity/studio-hints/components'
import {isTrayOpen} from 'part:@sanity/studio-hints/datastore'

import styles from './styles/Sidecar.css'

const StudioHints = StudioHintsComponents.StudioHintsLayout
// TODO: Open/close logic?

class Sidecar extends React.PureComponent {
  state = {
    isOpen: true //isTrayOpen()
  }

  onStorageChange = event => {
    console.log('onStorageChange', event)
    if (event.storageArea === localStorage) {
      console.log('  localStorage, in fact')
    }
  }

  componentDidMount = () => {
    console.log('listener added')
    window.addEventListener('storage', this.onStorageChange, {passive: true})
  }

  componentWillUnmount = () => {
    console.log('listener removed')
    window.removeEventListener('storage', this.onStorageChange, {passive: true})
  }

  render() {
    const {isOpen} = this.state
    console.log('isOpen', isOpen)

    if (!studioHintsConfig) {
      return null
    }
    return <div className={styles.root}>{StudioHints()}</div>
  }
}

export default Sidecar
