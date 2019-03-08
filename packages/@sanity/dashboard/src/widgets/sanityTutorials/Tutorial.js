import React from 'react'
import PropTypes from 'prop-types'
import styles from './Tutorial.css'

class Tutorial extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string.isRequired,
    posterURL: PropTypes.string,
    href: PropTypes.string.isRequired,
    presenterName: PropTypes.string.isRequired,
    presenterSubtitle: PropTypes.string.isRequired
  }
  static defaultProps = {
    posterURL: null
  }

  render() {
    const {title, posterURL, href, presenterName, presenterSubtitle} = this.props

    return (
      <a className={styles.root} href={href}>
        <div className={styles.posterContainer}>
          <img className={styles.poster} src={posterURL} />
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
