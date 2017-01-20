import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/previews/detail-style'
import {truncate} from 'lodash'
import MediaRender from './common/MediaRender.js'

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
    emptyText: PropTypes.string,
    children: PropTypes.node
  }

  static defaultProps = {
    emptyText: 'Untitled',
    mediaRender() {
      return false
    }
  }

  render() {
    const {item, emptyText, children} = this.props

    if (!item) {
      return (
        <div className={`${styles.empty}`}>
          {emptyText}
        </div>
      )
    }

    return (
      <div className={`${styles.root}`}>
        {
          (item.media || item.sanityImage || item.imageUrl) && <div className={`${styles.media}`}>
            <MediaRender item={item} />
          </div>
        }
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
        {children}
      </div>
    )
  }
}
