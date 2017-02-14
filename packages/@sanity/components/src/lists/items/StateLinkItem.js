import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/items/default-style'
import {StateLink} from 'part:@sanity/base/router'

export default class StateLinkItem extends React.Component {

  static propTypes = {
    children: PropTypes.node.isRequired,
    state: PropTypes.object.isRequired,
    hasFocus: PropTypes.bool
  }

  setStateLink = stateLink => {
    this._stateLink = stateLink
  }

  setElement = domElement => {
    this._domElement = domElement
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.hasFocus && this.props.hasFocus) {
      this._stateLink.focus()
    }
  }

  render() {
    const {children, state} = this.props
    return (
      <div ref={this.setElement}>
        <StateLink
          ref={this.setStateLink}
          tabIndex="0"
          className={styles.link}
          state={state}
        >
          {children}
        </StateLink>
      </div>
    )
  }
}
