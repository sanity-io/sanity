import React from 'react'
import StateLink from '../../src/components/StateLink'

export default class User extends React.Component<{
  id: string
}> {
  render() {
    const {id} = this.props
    const nextUserId = Math.random().toString(32).substring(2)
    return (
      <div>
        <h1>Showing a lot of information about user #{id}</h1>
        <p>
          <StateLink state={{userId: nextUserId}}>Go to user #{nextUserId}</StateLink>
        </p>
        <p>
          <StateLink state={{userId: 'me'}}>Show profile</StateLink>
        </p>
      </div>
    )
  }
}
