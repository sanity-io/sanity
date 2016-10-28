import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/previews/detail-style'

export default class DetailPreview extends React.Component {
  static propTypes = {
    item: PropTypes.shape({
      title: PropTypes.string,
      subtitle: PropTypes.string,
      description: PropTypes.string,
      mediaRender: PropTypes.func
    }),
    emptyText: PropTypes.string,
    children: PropTypes.node
  }

  static defaultProps = {
    emptyText: 'Nothing here…',
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
        <div className={`${styles.media}`}>
          {item.mediaRender && item.mediaRender()}
        </div>
        <div className={styles.heading}>
          <h2 className={styles.title}>
            {item.title || emptyText}
          </h2>
          <h3 className={styles.subtitle}>
            {item.subtitle}
          </h3>
        </div>
        <p className={styles.description}>{item.description}</p>
        {children}
      </div>
    )
  }
}
