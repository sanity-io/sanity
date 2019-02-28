import React from 'react'
import PropTypes from 'prop-types'
import styles from './Tutorial.css'

const PlayIcon = (
  <svg
    width="44"
    height="44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.playIcon}
  >
    <circle cx="22" cy="22" r="21.5" stroke="currentColor" />
    <path
      d="M30.643 22.848L17.53 31.044a1 1 0 0 1-1.53-.848V13.804a1 1 0 0 1 1.53-.848l13.113 8.196a1 1 0 0 1 0 1.696z"
      fill="currentColor"
    />
  </svg>
)

class Tutorial extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string.isRequired,
    hasVideo: PropTypes.bool,
    posterURL: PropTypes.string,
    href: PropTypes.string,
    presenterName: PropTypes.string,
    presenterSubtitle: PropTypes.string
  }

  render() {
    const {title, posterURL, href, presenterName, presenterSubtitle, hasVideo} = this.props

    return (
      <a className={styles.root} href={href}>
        <div className={styles.posterContainer}>
          <img className={styles.poster} src={posterURL} />
          {hasVideo && PlayIcon}
        </div>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.byLine}>
          <div className={styles.presenter}>
            <div>
              <div className={styles.presenterName}>{presenterName}</div>
              <div className={styles.presenterSubtitle}>{presenterSubtitle}</div>
            </div>
          </div>
        </div>
      </a>
    )
  }
}

export default Tutorial
