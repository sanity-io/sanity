import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/items/default-style'
import {StateLink} from 'part:@sanity/base/router'

export default class StateLinkItem extends React.Component {

  static propTypes = {
    children: PropTypes.node.isRequired,
    state: PropTypes.object.isRequired
  }

  render() {
    const {children, state} = this.props
    return (
      <StateLink
        tabIndex="0"
        className={styles.link}
        state={state}
      >
        {children}
      </StateLink>
    )
  }
}
