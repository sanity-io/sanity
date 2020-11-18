import React from 'react'
import {createPortal} from 'react-dom'
import styles from './Portal.css'

interface PortalProps {
  children?: React.ReactNode
}

const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
)

// @todo: refactor to functional component
export class Portal extends React.Component<PortalProps> {
  node?: HTMLDivElement

  componentWillUnmount() {
    if (this.node) {
      document.body.removeChild(this.node)
    }

    this.node = undefined
  }

  render() {
    if (!canUseDOM) {
      return null
    }

    if (!this.node) {
      this.node = document.createElement('div')
      document.body.appendChild(this.node)
    }

    return createPortal(
      <React.Fragment>
        {this.props.children}
        {/*
          the following element is needed to prevent tab key from navigating out of window context. Since the
          portal content is appended to the DOM, hitting the tab key while having focus on on the last element
          will navigate *out* of the document, causing focus to move to a browser UI control.
        */}
        <span tabIndex={0} className={styles.captureTabFocus} />
      </React.Fragment>,
      this.node
    )
  }
}
