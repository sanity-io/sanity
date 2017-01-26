import React, {PropTypes} from 'react'
import styles from './styles/TypePane.css'

export default class Pane extends React.PureComponent {

  static propTypes = {
    items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    renderItem: PropTypes.func
  }


  static contextTypes = {
    router: PropTypes.object
  }

  render() {
    const {items, renderItem} = this.props

    const {router} = this.context
    const {selectedType, action, selectedDocumentId} = router.state

    const isActive = !selectedType && !action && !selectedDocumentId

    return (
      <div className={`${isActive ? styles.isActive : styles.isInactive}`}>
        <div className={styles.top} />
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
}
