/* eslint-disable complexity */
import React from 'react'
import PropTypes from 'prop-types'
import {Tooltip} from 'react-tippy'
import styles from './styles/PresenceCircle.css'

export default class PresenceCircle extends React.PureComponent {
  static propTypes = {
    color: PropTypes.string,
    text: PropTypes.string,
    title: PropTypes.node,
    html: PropTypes.node,
    imageUrl: PropTypes.string,
    animateOnHover: PropTypes.bool,
    interactive: PropTypes.bool,
    user: PropTypes.shape({
      identity: PropTypes.string,
      imageUrl: PropTypes.string,
      displayName: PropTypes.string
    })
  }

  render() {
    const {text, color, title, interactive, html, imageUrl, animateOnHover} = this.props

    const imgStyles = {
      display: 'block',
      backgroundColor: color,
      borderColor: color,
      backgroundImage: imageUrl && `url(${imageUrl})`
    }

    return (
      <Tooltip
        disabled={!title && !html}
        title={title || 'Unknown user'}
        html={html}
        interactive={interactive}
        position="top"
        trigger="mouseenter"
        animation="scale"
        arrow
        theme="light"
        distance="10"
        duration={50}
        className={`${imageUrl ? styles.root : styles.noImage} ${
          animateOnHover ? styles.animateOnHover : ''
        }`}
        style={imgStyles}
      >
        {imageUrl ? '' : <span className={styles.initials}>{text}</span>}
      </Tooltip>
    )
  }
}
