import React, {PropTypes} from 'react'
import styles from './styles/PaneItem.css'

export default class PaneItem extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    selected: PropTypes.bool
  };

  render() {
    const {selected, children} = this.props
    return (
      <div
        className={selected ? styles.selectedItem : styles.item}
      >
        {children}
      </div>
    )
  }
}
