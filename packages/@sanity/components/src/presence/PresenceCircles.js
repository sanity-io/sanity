import React from 'react'
import PropTypes from 'prop-types'
import {TransitionMotion, spring} from 'react-motion'
import colorHasher from './colorHasher'
import PresenceCircle from './PresenceCircle'
import styles from './styles/PresenceCircles.css'
import PresenceList from './PresenceList'
import {Tooltip} from 'react-tippy'

const MAX_WIDTH = 100
const MAX_DISTANCE = 30
const MIN_DISTANCE = 15
const OUT_IN_DISTANCE = 20

function calcX(idx, len) {
  const distance = Math.min(Math.max(MAX_WIDTH / len, MIN_DISTANCE), MAX_DISTANCE)
  return 0 - idx * distance
}

function filterMarkers(markers) {
  return markers.filter(marker => marker.type === 'presence')
}

export default class PresenceCircles extends React.PureComponent {
  static propTypes = {
    maxMarkers: PropTypes.number,
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
    maxMarkers: 5,
    markers: []
  }

  willEnter = node => {
    const len = filterMarkers(this.props.markers).length
    const x = calcX(node.data.index, len) - OUT_IN_DISTANCE
    return {
      x,
      opacity: 0,
      scale: 0.5
    }
  }

  willLeave = node => {
    const len = filterMarkers(this.props.markers).length
    const x = calcX(node.data.index, len) - OUT_IN_DISTANCE
    return {
      x: spring(x, {stiffness: 400}),
      opacity: spring(0, {stiffness: 500}),
      scale: spring(0.5)
    }
  }

  render() {
    const {maxMarkers} = this.props
    const markers = filterMarkers(this.props.markers)
      .reverse()
      .map(marker => {
        return {...marker, color: colorHasher(marker.identity)}
      })
    const shownMarkers = markers.filter((marker, i) => i <= maxMarkers)
    const extraMarkers = markers.filter((marker, i) => i > maxMarkers)
    const len = markers.length

    if (len < 1) {
      return null
    }

    const offset = extraMarkers.length > 0 ? -10 : 0

    return (
      <TransitionMotion
        styles={shownMarkers.map((marker, idx) => {
          const index = shownMarkers.length - idx
          return {
            key: marker.session,
            data: {
              marker,
              index
            },
            style: {
              x: spring(offset + calcX(index, len), {damping: 15, stiffness: 400}),
              opacity: spring(1, {damping: 30, stiffness: 400}),
              scale: spring(1)
            }
          }
        })}
        willEnter={this.willEnter}
        willLeave={this.willLeave}
      >
        {interpolatedStyles => (
          <div className={styles.root}>
            {interpolatedStyles.map(({data, key, style}) => {
              const {index, marker} = data
              const {user, color} = marker
              const initials = (user && user.displayName.match(/\b\w/g).join('')) || '?'
              return (
                <div
                  className={styles.item}
                  key={key}
                  style={{
                    opacity: style.opacity,
                    transform: [`translate3d(${style.x}px, 0, 0)`, `scale(${style.scale})`].join(
                      ''
                    ),
                    zIndex: shownMarkers.length - index
                  }}
                >
                  <PresenceCircle
                    animateOnHover
                    imageUrl={marker.user && marker.user.imageUrl}
                    text={initials}
                    title={user.displayName}
                    color={color}
                  />
                </div>
              )
            })}
            {extraMarkers.length > 0 && (
              <div className={styles.extraItems} style={{zIndex: shownMarkers.length}}>
                <Tooltip
                  html={<PresenceList markers={extraMarkers} />}
                  interactive
                  position="top"
                  trigger="mouseenter"
                  animation="scale"
                  arrow
                  theme="light"
                  distance="10"
                  duration={50}
                >
                  +{extraMarkers.length}
                </Tooltip>
              </div>
            )}
          </div>
        )}
      </TransitionMotion>
    )
  }
}
