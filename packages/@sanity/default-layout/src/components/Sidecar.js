import PropTypes from 'prop-types'
import React from 'react'
import studioHintsConfig from 'part:@sanity/studio-hints/config?'
import StudioHintsComponents from 'part:@sanity/studio-hints/components'
import styles from './styles/Sidecar.css'

const StudioLayout = StudioHintsComponents.StudioHintsLayout

class Sidecar extends React.PureComponent {
  // What else does this need to do?
  static propTypes = {
    isOpen: PropTypes.bool
  }

  static defaultProps = {
    isOpen: true
  }

  render() {
    console.log('studioHintsConfig', studioHintsConfig)
    console.log('StudioHintsComponents', StudioHintsComponents)

    if (!studioHintsConfig) {
      return null
    }
    const {isOpen} = this.props
    return (
      <div className={styles.root}>
        <p>I'm a sidecar</p>
        {isOpen && <p>I'm showing hints!</p>}
        {StudioLayout()}
      </div>
    )
  }
}

export default Sidecar
