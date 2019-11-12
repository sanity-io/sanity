import PropTypes from 'prop-types'
import React from 'react'
import studioHintsConfig from 'part:@sanity/studio-hints/config?'
import StudioHintsComponents from 'part:@sanity/studio-hints/components'
import styles from './styles/Sidecar.css'

const StudioHints = StudioHintsComponents.StudioHintsLayout

class Sidecar extends React.PureComponent {
  static propTypes = {
    isOpen: PropTypes.bool
  }

  static defaultProps = {
    isOpen: true
  }

  render() {
    if (!studioHintsConfig) {
      return null
    }
    const {isOpen} = this.props
    return (
      <div className={styles.root}>
        <p>I'm a sidecar</p>
        {StudioHints()}
      </div>
    )
  }
}

export default Sidecar
