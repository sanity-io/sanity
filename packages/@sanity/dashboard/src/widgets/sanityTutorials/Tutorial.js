import React from 'react'
import PropTypes from 'prop-types'
import styles from './Tutorial.css'

class Tutorial extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string.isRequired,
    posterURL: PropTypes.string,
    href: PropTypes.string.isRequired,
    showPlayIcon: PropTypes.bool,
    presenterName: PropTypes.string.isRequired,
    presenterSubtitle: PropTypes.string.isRequired
  }
  static defaultProps = {
    posterURL: null,
    showPlayIcon: false
  }

  render() {
    const {title, posterURL, showPlayIcon, href, presenterName, presenterSubtitle} = this.props

    return (
      <a className={styles.root} href={href} target="_blank" rel="noopener noreferrer">
        <div className={styles.posterContainer}>
          <img className={styles.poster} src={posterURL} />
          {showPlayIcon && (
            <div className={styles.playIcon}>
              <span />
            </div>
          )}
        </div>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.byLine}>
          <div className={styles.presenterName}>{presenterName}</div>
          <div className={styles.presenterSubtitle}>{presenterSubtitle}</div>
        </div>
      </a>
    )
  }
}

export default Tutorial
