import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/previews/detail-style'
import {truncate} from 'lodash'
import MediaRender from './common/MediaRender.js'
import getPlaceholderItemStyles from './common/getPlaceholderItemStyles'

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
    emptyText: PropTypes.string,
    children: PropTypes.node,
    isPlaceholder: PropTypes.bool
  }

  static defaultProps = {
    emptyText: 'Untitled',
    mediaRender() {
      return false
    }
  }

  index = index++

  render() {
    const {item, emptyText, children, isPlaceholder, isLoading} = this.props

    if ((!item || isPlaceholder)) {
      const itemStyle = getPlaceholderItemStyles(this.index)
      return (
        <div className={`${styles.placeholder}`}>
          <div className={`${styles.media}`} />
          <div className={styles.content}>
            <div className={styles.heading}>
              <h2 className={styles.title} style={itemStyle.title} />
              <h3 className={styles.subtitle} style={itemStyle.subtitle} />
            </div>
            <p className={styles.description} style={{width: '100%'}} />
            <p className={styles.description} style={itemStyle.description} />
          </div>
        </div>
      )
    }

    return (
      <div className={`${styles.root}`}>
        <div className={`${styles.media}`}>
          <MediaRender item={item} fallbackText="No media" />
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
