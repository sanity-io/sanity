import React from 'react'
import PropTypes from 'prop-types'
import styles from './styles/ValidationListItem.css'
import WarningIcon from 'part:@sanity/base/warning-icon'
import LinkIcon from 'part:@sanity/base/link-icon'

export default class ValidationListItem extends React.PureComponent {
  static propTypes = {
    onClick: PropTypes.func,
    showLink: PropTypes.bool,
    path: PropTypes.string,
    marker: PropTypes.shape({
      path: PropTypes.arrayOf(
        PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number,
          PropTypes.shape({_key: PropTypes.string})
        ])
      ),
      type: PropTypes.string,
      level: PropTypes.string,
      item: PropTypes.any
    }).isRequired
  }

  static defaultProps = {
    path: '',
    onClick: undefined,
    showLink: false
  }

  handleClick = event => {
    const {marker, onClick} = this.props
    if (onClick) {
      onClick(event, marker.path)
    }
  }

  render() {
    const {marker, onClick, path, showLink} = this.props
    const shouldRenderLink = onClick && showLink

    return (
      <li
        className={`
          ${onClick ? styles.interactiveItem : styles.item}
          ${styles[marker.level]}
        `}
        onClick={this.handleClick}>
        <span className={styles.icon}>
          <WarningIcon />
        </span>

        <div className={styles.content}>
          <span className={styles.path}>
            {path}
          </span>
          <span className={styles.message}>
            {marker.item.message}
          </span>
        </div>

        {shouldRenderLink && (
          <span className={styles.link} title="View">
            <LinkIcon />
          </span>
        )}
      </li>
    )
  }
}
