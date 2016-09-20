import React, {PropTypes} from 'react'
import {StateLink} from 'part:@sanity/base/router'

const WRAPPER_STYLE = {
  position: 'fixed',
  padding: 5,
  right: 0,
  backgroundColor: '#fff',
  borderLeftWidth: 1,
  borderBottomWidth: 1,
  borderRightWidth: 0,
  borderTopWidth: 0,
  borderColor: '#aaa',
  borderStyle: 'solid'
}

export default class ActionButton extends React.Component {
  static propTypes = {
    actions: PropTypes.array
  }
  render() {
    const {actions} = this.props
    return (
      <div style={WRAPPER_STYLE}>
        {actions.map(action => (
          <StateLink key={action.title} style={{padding: 10}} state={action.nextState}>{action.title}</StateLink>
        ))}
      </div>
    )

  }
}
