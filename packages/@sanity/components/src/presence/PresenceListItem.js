/* eslint-disable complexity */
import React from 'react'
import PropTypes from 'prop-types'
import {Tooltip} from 'react-tippy'
import userStore from 'part:@sanity/base/user'
import styles from './styles/PresenceListItem.css'
import colorHasher from './colorHasher'

export default class PresenceListItem extends React.PureComponent {
  static propTypes = {
    identity: PropTypes.string.isRequired
  }

  state = {user: {}}

  constructor(props) {
    super(props)
    this.fetchUser(props.identity)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.identity !== this.props.identity) {
      this.fetchUser(nextProps.identity)
    }
  }

  fetchUser(userId) {
    userStore.getUser(userId).then(user => this.setState({user}))
  }

  render() {
    const {user} = this.state
    const imgUrl = user.imageUrl || user.profileImage
    const userColor = colorHasher(this.props.identity)
    const imgStyles = {
      display: 'block',
      borderColor: userColor,
      backgroundColor: userColor,
      backgroundImage: imgUrl && `url(${imgUrl})`
    }

    return (
      <Tooltip
        title={user.displayName || 'Loading...'}
        position="top"
        trigger="mouseenter"
        animation="scale"
        arrow
        theme="light"
        distance="10"
        duration={50}
        className={styles.root}
        style={imgStyles}
      />
    )
  }
}
