import React from 'react'
import PropTypes from 'prop-types'
import {IntentLink} from 'part:@sanity/base/router'
import PresenceListItem from 'part:@sanity/components/presence/list-item'
import styles from './styles/Presence.css'

class Presence extends React.PureComponent {
  render() {
    const {presence} = this.props

    return (
      <div className={styles.root}>
        {presence.map(session => (
          <IntentLink
            key={session.session}
            onFocus={this.handleFocus}
            tabIndex="0"
            intent="edit"
            params={{id: session.documentId, type: '*'}}
          >
            <PresenceListItem identity={session.identity} />
          </IntentLink>
        ))}
      </div>
    )
  }
}

Presence.propTypes = {
  presence: PropTypes.arrayOf(
    PropTypes.shape({
      documentId: PropTypes.string,
      session: PropTypes.string,
      identity: PropTypes.string
    }).isRequired
  ).isRequired
}

export default Presence
