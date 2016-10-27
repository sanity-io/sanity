import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/previews/default-style'

export default class DefaultPreview extends React.Component {
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
    emptyText: 'Nothing here…'
  }

  render() {
    const {item, emptyText, children} = this.props
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
        {
          children && <div className={styles.children}>{children}</div>
        }
      </div>
    )
  }
}
