/* eslint-disable prefer-template */
import React from 'react'
import studioHintsConfig from 'part:@sanity/default-layout/studio-hints-config?'
import {SidecarLayout} from 'part:@sanity/default-layout/sidecar?'
import {isSidecarOpenSetting} from 'part:@sanity/default-layout/sidecar-datastore'
import styles from './styles/Sidecar.css'

class Sidecar extends React.PureComponent {
  state = {
    isOpen: true,
    isVisible: true
  }

  componentDidMount() {
    if (studioHintsConfig) {
      this.subscription = isSidecarOpenSetting.listen().subscribe(isOpen => {
        this.setState({isOpen: isOpen !== false})
      })
    }
    if (!this.state.isOpen) {
      this.handleRemoveSidecar()
    }
  }

  handleRemoveSidecar = () => {
    this.setState({
      isVisible: false
    })
  }

  handleDismissSidecar = () => {
    const transitionDuration = 500 // from the isOpen class
    setTimeout(() => {
      this.handleRemoveSidecar()
    }, transitionDuration)
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  componentDidUpdate() {
    // eslint-disable-next-line react/no-did-update-set-state
    return this.state.isOpen ? this.setState({isVisible: true}) : this.handleDismissSidecar()
  }

  render() {
    const {isOpen, isVisible} = this.state

    if (studioHintsConfig) {
      return (
        <div className={`${styles.root} ${isOpen ? styles.isOpen : ''}`}>
          {isVisible && <SidecarLayout />}
        </div>
      )
    }

    return null
  }
}

export default Sidecar
