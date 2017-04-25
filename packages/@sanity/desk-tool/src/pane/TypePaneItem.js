import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/TypePaneItem.css'
import {StateLink} from 'part:@sanity/base/router'

export default class TypePaneItem extends React.Component {
  static propTypes = {
    type: PropTypes.shape({
      name: PropTypes.string,
      title: PropTypes.string,
      icon: PropTypes.element
    }),
    selected: PropTypes.bool
  }

  render() {
    const {selected, type} = this.props

    return (
      <div
        className={selected ? styles.selected : styles.item}
        key={document._id}
      >
        <StateLink
          state={{selectedType: type.name}}
          className={styles.link}
        >
          {type.title}
        </StateLink>
      </div>
    )
  }
}
