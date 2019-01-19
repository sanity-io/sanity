import React from 'react'
import styles from './styles/Presence.css'
import PresenceListItem from 'part:@sanity/components/presence/list-item'

class Presence extends React.PureComponent {
  render() {
    const {users} = this.props

    return (
      <div className={styles.root}>
        {users && users.map((user, i) => <PresenceListItem key={i} user={this.props.user} marker={user.marker} />)}
      </div>
    )
  }
}

export default Presence
