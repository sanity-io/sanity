import PropTypes from 'prop-types'
import React from 'react'
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
        className={`
          ${styles.typeItem}
          ${selected ? styles.selected : styles.item}
        `}
      >
        {children}
      </div>
    )
  }
}
