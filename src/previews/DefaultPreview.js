import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/previews/default-style'

export default class DefaultPreview extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    subtitle: PropTypes.string,
    description: PropTypes.string,
    sanityImage: PropTypes.object,
    emptyText: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const {title, subtitle, description, emptyText, children} = this.props
    return (
      <div className={`${styles.root}`}>
        <div className={styles.heading}>
          <h2 className={styles.title}>
            {title || emptyText}
          </h2>
          <h3 className={styles.subtitle}>
            {subtitle}
          </h3>
        </div>
        <p className={styles.description}>{description}</p>
        {children}
      </div>
    )
  }
}
