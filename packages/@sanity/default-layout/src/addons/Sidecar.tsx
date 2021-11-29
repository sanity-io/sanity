// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {LegacyLayerProvider} from '@sanity/base/components'
import {Layer} from '@sanity/ui'
import React from 'react'
import type {Subscription} from 'rxjs'
import * as sidecar from 'part:@sanity/default-layout/sidecar?'
import {isSidecarOpenSetting} from 'part:@sanity/default-layout/sidecar-datastore'
import styled, {css} from 'styled-components'

const Root = styled(Layer)<{$open: boolean}>`
  max-width: 420px;
  height: 100%;

  ${({$open}) =>
    $open &&
    css`
      transform: translate3d(0, 0, 0);
    `}
`

let isSidecarEnabled: () => boolean | null = null
let SidecarLayout: React.ComponentType | null = null
if (sidecar) {
  isSidecarEnabled = sidecar.isSidecarEnabled
  SidecarLayout = sidecar.SidecarLayout
}

interface State {
  isOpen: boolean
  isVisible: boolean
}

// eslint-disable-next-line @typescript-eslint/ban-types
class Sidecar extends React.PureComponent<{}, State> {
  state = {
    isOpen: true,
    isVisible: true,
  }

  subscription: Subscription | null = null

  componentDidMount() {
    if (isSidecarEnabled && isSidecarEnabled()) {
      this.subscription = isSidecarOpenSetting.listen().subscribe((isOpen: boolean) => {
        this.setState({isOpen: isOpen !== false})
      })
    }
    if (!this.state.isOpen) {
      this.handleRemoveSidecar()
    }
  }

  handleRemoveSidecar = () => {
    this.setState({
      isVisible: false,
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

    if (!isVisible || !(isSidecarEnabled && isSidecarEnabled())) {
      return null
    }

    return (
      <LegacyLayerProvider zOffset="pane">
        <Root $open={isOpen}>{isVisible && <SidecarLayout />}</Root>
      </LegacyLayerProvider>
    )
  }
}

export default Sidecar
