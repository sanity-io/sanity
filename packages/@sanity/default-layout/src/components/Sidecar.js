import PropTypes from 'prop-types'
import React from 'react'
import studioHintsConfig from 'part:@sanity/studio-hints/config?'
import StudioHintsComponents from 'part:@sanity/studio-hints/components'
import styles from './styles/Sidecar.css'

const StudioHints = StudioHintsComponents.StudioHintsLayout
// TODO: Open/close logic?
class Sidecar extends React.PureComponent {
  render() {
    if (!studioHintsConfig) {
      return null
    }
    return <div className={styles.root}>{StudioHints()}</div>
  }
}

export default Sidecar
