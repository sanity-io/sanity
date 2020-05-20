/* eslint-disable prefer-template */

import React from 'react'
import {
  isSidecarOpenSetting,
  toggleSidecarOpenState
} from 'part:@sanity/default-layout/sidecar-datastore'
import styles from './ToggleSidecarButton.css'
import CloseCircleIcon from './icons/CloseCircle'
import HelpCircleIcon from './icons/HelpCircle'

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
    return (
      <button
        className={styles.toggleButton}
        onClick={toggleSidecarOpenState}
        type="button"
        aria-label="Toggle sidecar"
        aria-pressed={isOpen}
      >
        <div className={styles.inner} tabIndex={-1}>
          {isOpen ? <CloseCircleIcon /> : <HelpCircleIcon />}
        </div>
      </button>
    )
  }
}
