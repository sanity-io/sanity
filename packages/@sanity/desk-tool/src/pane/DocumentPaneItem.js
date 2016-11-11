import React, {PropTypes} from 'react'
import styles from './styles/PaneItem.css'
import Preview from 'part:@sanity/base/preview'
import {StateLink} from 'part:@sanity/base/router'
import PaneItem from './PaneItem.js'

export default class DocumentPaneItem extends React.Component {
  static propTypes = {
    document: PropTypes.object.isRequired,
    selected: PropTypes.bool,
    listView: PropTypes.string.isRequired,
    schemaType: PropTypes.object.isRequired,
    linkState: PropTypes.object.isRequired,
  };

  render() {
    const {selected, linkState, document, listView, schemaType} = this.props
    return (
      <PaneItem
        key={document._id}
        selected={selected}
      >
        <StateLink
          state={linkState}
          className={styles.stateLink}>
          <Preview
            value={document}
            style={listView}
            typeDef={schemaType}
          />
        </StateLink>
      </PaneItem>
    )
  }
}
