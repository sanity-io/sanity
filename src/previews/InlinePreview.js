import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/previews/inline-style'

export default class InlinePreview extends React.Component {
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
      <span className={`${styles.root}`}>
        <span className={`${styles.media}`}>
          {item.mediaRender && item.mediaRender()}
        </span>
        <span className={styles.title}>
          {item.title || emptyText}
        </span>
        {children && <span>{children}</span>}
      </span>
    )
  }
}
