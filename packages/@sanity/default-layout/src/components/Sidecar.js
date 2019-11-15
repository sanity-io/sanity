/* eslint-disable no-console */
/* eslint-disable prefer-template */
import React from 'react'

import sidecarConfig from 'part:@sanity/default-layout/sidecar-config?'
import {SidecarLayout} from 'part:@sanity/default-layout/sidecar'
import {isSidecarOpenSetting} from 'part:@sanity/default-layout/sidecar-datastore'

import styles from './styles/Sidecar.css'

class Sidecar extends React.PureComponent {
  state = {
    isOpen: true
  }

  componentDidMount() {
    if (sidecarConfig) {
      this.subscription = isSidecarOpenSetting.listen().subscribe(isOpen => {
        this.setState({isOpen: isOpen !== false})
      })
    }
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  render() {
    const {isOpen} = this.state

    if (sidecarConfig && isOpen) {
      return (
        <div className={styles.root}>
          <SidecarLayout />
        </div>
      )
    }

    return null
  }
}

export default Sidecar
