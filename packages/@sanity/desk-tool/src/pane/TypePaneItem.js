import React, {PropTypes} from 'react'
import styles from './styles/PaneItem.css'
import {StateLink} from 'part:@sanity/base/router'
import PaneItem from './PaneItem.js'

export default class TypePaneItem extends React.Component {
  static propTypes = {
    type: PropTypes.shape({
      name: PropTypes.string,
      title: PropTypes.string
    }),
    selected: PropTypes.bool,
    linkState: PropTypes.object,
  };

  render() {
    const {selected, type} = this.props
    return (
      <PaneItem
        key={document._id}
        selected={selected}
      >
        <StateLink
          state={{selectedType: type.name}}
          className={styles.stateLink}>
          {type.title}
        </StateLink>
      </PaneItem>
    )
  }
}
