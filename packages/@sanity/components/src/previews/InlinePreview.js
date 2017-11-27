import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/previews/inline-style'

export default class InlinePreview extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string,
    renderMedia: PropTypes.func,
    children: PropTypes.node
  }

  static defaultProps = {
    title: undefined,
  }

  render() {
    const {
      title,
      renderMedia,
      children
    } = this.props

    if (!title && !renderMedia) {
      return <span />
    }

    return (
      <span className={styles.root}>
        {
          (renderMedia) && (
            <span className={styles.media}>
              {renderMedia()}
            </span>
          )
        }
        <span className={styles.title}>
          {title}
        </span>
        {children && <span>{children}</span>}
      </span>
    )
  }
}
