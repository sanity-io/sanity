import classNames from 'classnames'
import React from 'react'
import * as sidecar from 'part:@sanity/default-layout/sidecar?'
import {isSidecarOpenSetting} from 'part:@sanity/default-layout/sidecar-datastore'
import styles from './Sidecar.css'

let isSidecarEnabled
let SidecarLayout
if (sidecar) {
  isSidecarEnabled = sidecar.isSidecarEnabled
  SidecarLayout = sidecar.SidecarLayout
}

class Sidecar extends React.PureComponent {
  state = {
    isOpen: true,
    isVisible: true
  }

  componentDidMount() {
    if (isSidecarEnabled && isSidecarEnabled()) {
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

    if (!(isSidecarEnabled && isSidecarEnabled())) {
      return null
    }

    return (
      <div className={classNames(styles.root, isOpen && styles.isOpen)}>
        {isVisible && <SidecarLayout />}
      </div>
    )
  }
}

export default Sidecar
