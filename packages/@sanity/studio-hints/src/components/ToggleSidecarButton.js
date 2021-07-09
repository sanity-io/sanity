/* eslint-disable prefer-template */

import React from 'react'
import {
  isSidecarOpenSetting,
  toggleSidecarOpenState,
} from 'part:@sanity/default-layout/sidecar-datastore'
import {Button as UIButton, studioTheme, ThemeProvider} from '@sanity/ui'
import {HelpCircleIcon} from '@sanity/icons'
import styled from 'styled-components'

const Button = styled(UIButton)`
  width: 33px;
  height: 33px;

  &:not(:hover):not(:focus):not([data-selected]) {
    background: transparent;
    box-shadow: unset;
  }
`

export default class ToggleSidecarButton extends React.PureComponent {
  state = {
    isOpen: true,
  }

  componentDidMount() {
    this.subscription = isSidecarOpenSetting.listen().subscribe((isOpen) => {
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

    return (
      <ThemeProvider theme={studioTheme} scheme="dark">
        <Button
          padding={0}
          aria-label="Toggle sidecar"
          aria-pressed={isOpen}
          icon={HelpCircleIcon}
          onClick={toggleSidecarOpenState}
          selected={isOpen}
          tone="primary"
          mode="bleed"
        />
      </ThemeProvider>
    )
  }
}
