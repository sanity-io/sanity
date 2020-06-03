import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/previews/inline-style'

const fieldProp = PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.func])

export default class InlinePreview extends React.PureComponent {
  static propTypes = {
    title: fieldProp,
    media: fieldProp,
    children: PropTypes.node,
    mediaDimensions: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      fit: PropTypes.oneOf(['clip', 'crop', 'fill', 'fillmax', 'max', 'scale', 'min']),
      aspect: PropTypes.number
    })
  }

  static defaultProps = {
    title: undefined,
    children: undefined,
    media: undefined,
    mediaDimensions: {width: 32, height: 32, fit: 'crop', aspect: 1}
  }

  render() {
    const {title, media, mediaDimensions, children} = this.props

    if (!title && !media) {
      return <span />
    }

    return (
      <span className={styles.root}>
        {media && (
          <span className={styles.media}>
            {typeof media === 'function' && media({dimensions: mediaDimensions, layout: 'default'})}
            {typeof media !== 'function' && media}
            {React.isValidElement(media) && media}
          </span>
        )}
        <span className={styles.title}>
          {(typeof title === 'function' && title({layout: 'inline'})) || title}
        </span>
        {children && <span className={styles.children}>{children}</span>}
      </span>
    )
  }
}
