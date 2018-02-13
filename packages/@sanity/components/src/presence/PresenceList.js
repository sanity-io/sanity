import React from 'react'
import PropTypes from 'prop-types'
import PresenceListItem from './PresenceListItem'

export default class PresenceList extends React.PureComponent {
  static propTypes = {
    markers: PropTypes.arrayOf(
      PropTypes.shape({
        path: PropTypes.arrayOf(
          PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
            PropTypes.shape({_key: PropTypes.string})
          ])
        ),
        type: PropTypes.string,
        identity: PropTypes.string,
        session: PropTypes.string
      })
    )
  }

  static defaultProps = {
    markers: []
  }

  render() {
    const presence = this.props.markers.filter(marker => marker.type === 'presence')
    if (presence.length === 0) {
      return null
    }

    return (
      <div>{presence.map(marker => <PresenceListItem key={marker.session} marker={marker} />)}</div>
    )
  }
}
