/* eslint-disable complexity */
import React from 'react'
import PropTypes from 'prop-types'
import {Tooltip} from '@sanity/react-tippy'
import userStore from 'part:@sanity/base/user'
import styles from './styles/PresenceListItem.css'
import colorHasher from './colorHasher'

export default class PresenceListItem extends React.PureComponent {
  static propTypes = {
    marker: PropTypes.shape({
      identity: PropTypes.string,
      session: PropTypes.string
    }).isRequired
  }

  state = {user: {}}

  constructor(props) {
    super(props)
    this.fetchUser(props.marker.identity)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.marker.identity !== this.props.marker.identity) {
      this.fetchUser(nextProps.marker.identity)
    }
  }

  fetchUser(userId) {
    userStore.getUser(userId).then(user => this.setState({user}))
  }

  render() {
    const {user} = this.state
    const imgUrl = user.imageUrl || user.profileImage
    const userColor = colorHasher.hex(this.props.marker.session)
    const imgStyles = {
      borderColor: userColor,
      backgroundColor: userColor,
      backgroundImage: imgUrl && `url(${imgUrl})`
    }

    return (
      <Tooltip
        title={user.displayName || 'Loading...'}
        trigger="mouseenter"
        animation="scale"
        arrow
        theme="light"
        distance="2"
        duration={50}
      >
        <div className={styles.root} style={imgStyles} />
      </Tooltip>
    )
  }
}
