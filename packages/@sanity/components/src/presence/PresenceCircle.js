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
    showTooltip: PropTypes.bool
  }

  static defaultProps = {
    showTooltip: true
  }

  render() {
    const {
      text,
      color,
      title,
      interactive,
      html,
      imageUrl,
      animateOnHover,
      showTooltip
    } = this.props

    const imgStyles = {
      display: 'block',
      backgroundColor: color,
      backgroundImage: imageUrl && `url(${imageUrl})`
    }

    return (
      <Tooltip
        disabled={!showTooltip || (!title && !html)}
        title={title}
        html={html}
        interactive={interactive}
        position="top"
        trigger="mouseenter"
        animation="scale"
        arrow
        theme="light"
        distance="10"
        duration={50}
        className={`${styles.root} ${animateOnHover ? styles.animateOnHover : ''}`}
        style={imgStyles}
      >
        {imageUrl ? '' : <span className={styles.initials}>{text}</span>}
      </Tooltip>
    )
  }
}
