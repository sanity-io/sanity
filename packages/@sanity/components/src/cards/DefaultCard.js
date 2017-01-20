import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/cards/default-style'

export default class DefaultCard extends React.Component {
  static propTypes = {
    title: PropTypes.func,
    children: PropTypes.node.isRequired,
    menu: PropTypes.array
  }

  render() {
    const {title, children, menu} = this.props

    return (
      <div className={styles.root}>

        <div className={styles.inner}>
          <div className={styles.top}>
            <h2 className={styles.title}>{title}</h2>
          </div>

          <div className={styles.content}>{children}</div>

          <div className={styles.menu}>
            {menu}
            This is the menu
          </div>
        </div>
      </div>
    )
  }
}
