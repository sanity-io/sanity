import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/previews/detail-style'
import {truncate} from 'lodash'
import MediaRender from './common/MediaRender.js'
import SvgPlaceholder from './common/SvgPlaceholder'

let index = 0

export default class DetailPreview extends React.Component {
  static propTypes = {
    item: PropTypes.shape({
      title: PropTypes.string,
      subtitle: PropTypes.string,
      description: PropTypes.string,
      media: PropTypes.node,
      imageUrl: PropTypes.string,
      sanityImage: PropTypes.object
    }),
    assetSize: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      fit: PropTypes.oneOf(['clip', 'crop', 'clamp'])
    }),
    emptyText: PropTypes.string,
    children: PropTypes.node,
    isPlaceholder: PropTypes.bool
  }

  static defaultProps = {
    emptyText: 'Untitled',
    assetSize: {width: 80, height: 80},
  }

  index = index++

  render() {
    const {item, emptyText, assetSize, children, isPlaceholder} = this.props

    if (!item || isPlaceholder) {
      return (
        <div className={`${styles.root}`}>
          <SvgPlaceholder styles={styles} />
        </div>
      )
    }

    return (
      <div className={`${styles.root}`}>
        <div className={`${styles.media}`}>
          <MediaRender size={assetSize} item={item} fallbackText="No media" />
        </div>
        <div className={styles.content}>
          <div className={styles.heading}>
            <h2 className={styles.title}>
              {item.title || emptyText}
            </h2>
            {
              item.subtitle && (
                <h3 className={styles.subtitle}>
                  {item.subtitle}
                </h3>
              )
            }
          </div>
          {
            item.description && (
              <p className={styles.description}>
                {
                  truncate(item.description, {
                    length: 70,
                    separator: /,? +/
                  })
                }
              </p>
            )
          }
        </div>

        {children}
      </div>
    )
  }
}
