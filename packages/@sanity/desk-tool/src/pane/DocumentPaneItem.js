import React, {PropTypes} from 'react'
import Preview from 'part:@sanity/base/preview'
import PaneItem from './PaneItem.js'

export default class DocumentPaneItem extends React.Component {
  static propTypes = {
    document: PropTypes.object.isRequired,
    selected: PropTypes.bool,
    listView: PropTypes.string.isRequired,
    schemaType: PropTypes.object.isRequired
  };

  render() {
    const {selected, document, listView, schemaType} = this.props
    return (
      <PaneItem
        key={document._id}
        selected={selected}
      >
        <Preview
          value={document}
          style={listView}
          typeDef={schemaType}
        />
      </PaneItem>
    )
  }
}
