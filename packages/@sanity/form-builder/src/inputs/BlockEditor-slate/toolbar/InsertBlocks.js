import React, {PropTypes} from 'react'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'

export const insertBlockShape = PropTypes.shape({
  type: PropTypes.object,
  title: PropTypes.string
})

export default class InsertBlocks extends React.Component {

  static propTypes = {
    onInsertBlock: PropTypes.func,
    blocks: PropTypes.arrayOf(insertBlockShape)
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.props.blocks !== nextProps.blocks
  }

  render() {
    return (
      <DropDownButton items={this.props.blocks} onAction={this.props.onInsertBlock} kind="simple">
        Insert
      </DropDownButton>
    )
  }
}
