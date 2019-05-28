import React from 'react'
import PropTypes from 'prop-types'
import PresenceCircle from './PresenceCircle'
import styles from './styles/PresenceList.css'

function filterMarkers(markers) {
  return markers.filter(marker => marker.type === 'presence')
}

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
    const markers = filterMarkers(this.props.markers)

    return (
      <ul className={styles.root}>
        {markers.map(marker => {
          const {user} = marker
          const imageUrl = user.imageUrl
          const initials = (user && user.displayName.match(/\b\w/g).join('')) || '?'
          return (
            <li key={marker.identity} className={styles.item}>
              <div className={styles.circle}>
                <PresenceCircle imageUrl={imageUrl} color={marker.color} text={initials} />
              </div>
              {user.displayName}
            </li>
          )
        })}
      </ul>
    )
  }
}
