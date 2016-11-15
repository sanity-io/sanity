import React, {PropTypes} from 'react'
import styles from './styles/TypePane.css'
import DefaultList from 'part:@sanity/components/lists/default'

export default class Pane extends React.Component {

  static propTypes = {
    isActive: PropTypes.bool,
    items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    renderItem: PropTypes.func,
    onUpdate: PropTypes.func
  }

  static defaultProps = {
    isActive: false,
    onUpdate() {}
  }

  componentDidUpdate() {
    this.props.onUpdate()
  }

  render() {
    const {isActive, items, renderItem} = this.props

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
