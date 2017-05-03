import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/previews/default-style'
import MediaRender from './common/MediaRender.js'
import SvgPlaceholder from './common/SvgPlaceholder'
import {get} from 'lodash'

const PLACEHOLDER = (
  <div className={styles.root}>
    <SvgPlaceholder styles={styles} />
  </div>
)

export default class DefaultPreview extends React.Component {
  static propTypes = {
    item: PropTypes.shape({
      title: PropTypes.string,
      subtitle: PropTypes.string,
      description: PropTypes.string,
      media: PropTypes.node,
      imageUrl: PropTypes.string,
      sanityImage: PropTypes.object
    }),
    type: PropTypes.shape({
      preview: PropTypes.shape({
        title: PropTypes.string,
        subtitle: PropTypes.string,
        description: PropTypes.string,
        imageUrl: PropTypes.string,
      })
    }),
    assetSize: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      fit: PropTypes.oneOf(['clip', 'crop', 'clamp'])
    }),
    emptyText: PropTypes.string,
    isPlaceholder: PropTypes.bool,
    children: PropTypes.node
  }

  static defaultProps = {
    emptyText: 'Untitled',
    assetSize: {width: 40, height: 40},
    type: {}
  }

  render() {
    const {item, assetSize, emptyText, children, isPlaceholder, type} = this.props

    const hasMedia = get(type, 'preview.select.imageUrl')

    if (!item || isPlaceholder) {
      return (
        <div
          className={`
            ${hasMedia ? styles.hasMedia : ''}
          `}
        >
          {PLACEHOLDER}
        </div>
      )
    }

    return (
      <div
        className={`
          ${styles.root}
          ${item.subtitle ? styles.hasSubtitle : ''}
          ${hasMedia ? styles.hasMedia : ''}
        `}
      >
        {
          hasMedia && (
            <div className={`${styles.media}`}>
              {
                (item.media || item.sanityImage || item.imageUrl) && (
                  <MediaRender size={assetSize} item={item} />
                )
              }
            </div>
          )
        }
        <div className={styles.heading}>
          <h2 className={styles.title}>
            {item.title || emptyText}
          </h2>
          {
            item.subtitle && <h3 className={styles.subtitle}>
              {item.subtitle}
            </h3>
          }
        </div>
        {
          children && <div className={styles.children}>{children}</div>
        }
      </div>
    )
  }
}
