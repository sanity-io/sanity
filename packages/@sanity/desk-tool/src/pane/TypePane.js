import React, {PropTypes} from 'react'
import styles from './styles/TypePane.css'

export default class Pane extends React.Component {

  static propTypes = {
    items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    renderItem: PropTypes.func,
    onUpdate: PropTypes.func
  }

  static defaultProps = {
    onUpdate() {}
  }

  static contextTypes = {
    router: PropTypes.object
  }

  componentDidUpdate() {
    this.props.onUpdate()
  }

  render() {
    const {items, renderItem} = this.props

    const {router} = this.context
    const {selectedType, action, selectedDocumentId} = router.state

    const isActive = !selectedType && !action && !selectedDocumentId

    return (
      <div className={`${isActive ? styles.isActive : styles.isInactive}`}>
        <ul className={styles.listContainer}>
          {
            items.map((item, i) => {
              return (
                <li key={i}>
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
