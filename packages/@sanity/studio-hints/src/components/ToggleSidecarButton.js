/* eslint-disable prefer-template */
import React from 'react'
import Lightbulb from 'part:@sanity/base/lightbulb-icon'
import IoLightbulb from 'react-icons/lib/io/lightbulb'

import {isSidecarOpenSetting} from 'part:@sanity/default-layout/sidecar-datastore'

export default class ToggleSidecarButton extends React.PureComponent {
  state = {
    isOpen: true
  }

  componentDidMount() {
    this.subscription = isSidecarOpenSetting.listen().subscribe(isOpen => {
      this.setState({isOpen: isOpen !== false})
    })
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  render() {
    const {isOpen} = this.state
    return isOpen ? (
      <span style={{color: '#ffba00'}}>
        <IoLightbulb />
      </span>
    ) : (
      <Lightbulb />
    )
  }
}
