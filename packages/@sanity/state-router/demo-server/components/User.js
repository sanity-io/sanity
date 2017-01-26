import React, {PropTypes} from 'react'
import StateLink from '../../src/components/StateLink'
import SomeChild from './SomeChild'

export default class User extends React.Component {
  static propTypes = {
    id: PropTypes.string
  }
  render() {
    const {id} = this.props
    const nextUserId = Math.random().toString(32).substring(2)
    return (
      <div>
        <h1>Showing a lot of information about user #{id}</h1>
        <p>
          <StateLink state={{userId: nextUserId}}>
            <SomeChild />
          </StateLink>
        </p>
        <p>
          <StateLink state={{userId: 'me'}}>Show profile</StateLink>
        </p>
      </div>
    )
  }
}
