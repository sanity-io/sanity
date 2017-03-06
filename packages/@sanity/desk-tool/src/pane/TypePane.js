import React, {PropTypes} from 'react'
import styles from './styles/TypePane.css'
import {withRouterHOC} from 'part:@sanity/base/router'
import PaneMenuContainer from './PaneMenuContainer'

export default withRouterHOC(class Pane extends React.PureComponent {

  static propTypes = {
    items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    renderItem: PropTypes.func,
    router: PropTypes.shape({
      state: PropTypes.object
    })
  }

  render() {
    const {items, renderItem, router} = this.props
    const {selectedType, action, selectedDocumentId} = router.state

    const isActive = !selectedType && !action && !selectedDocumentId

    return (
      <div className={`${isActive ? styles.isActive : styles.isInactive}`}>
        <div className={styles.top}>
          <div className={styles.heading}>
            Content
          </div>
        </div>
        <ul className={styles.listContainer}>
          {
            items.map((item, i) => {
              return (
                <li key={i} className={styles.item}>
                  {renderItem(item)}
                </li>
              )
            })
          }
        </ul>
      </div>
    )
  }
})
