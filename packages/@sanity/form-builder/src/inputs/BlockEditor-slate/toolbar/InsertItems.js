import React, {PropTypes} from 'react'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'

export const insertItemShape = PropTypes.shape({
  type: PropTypes.object,
  title: PropTypes.string
})

export default class InsertBlocks extends React.Component {

  static propTypes = {
    onInsertItem: PropTypes.func,
    items: PropTypes.arrayOf(insertItemShape)
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.props.items !== nextProps.items
  }

  render() {
    return (
      <DropDownButton items={this.props.items} onAction={this.props.onInsertItem} kind="simple">
        Insert
      </DropDownButton>
    )
  }
}
