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
    posterURL: PropTypes.string,
    readURL: PropTypes.string,
    videoURL: PropTypes.string,
    presenterName: PropTypes.string,
    presenterAvatar: PropTypes.string,
    presenterSubtitle: PropTypes.string
  }

  render() {
    const {
      title,
      posterURL,
      readURL,
      videoURL,
      presenterName,
      presenterAvatar,
      presenterSubtitle
    } = this.props

    return (
      <div className={styles.root}>
        <a className={styles.posterContainer} href={videoURL || readURL}>
          <img className={styles.poster} src={posterURL} />
          {videoURL && PlayIcon}
        </a>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.byLine}>
          <div className={styles.presenter}>
            <img src={presenterAvatar} className={styles.presenterAvatar} />
            <div>
              <div className={styles.presenterName}>{presenterName}</div>
              <div className={styles.presenterSubtitle}>Something must go here</div>
            </div>
          </div>
          {readURL && videoURL && <a href={readURL}>Read</a>}
        </div>
      </div>
    )
  }
}

export default Tutorial
