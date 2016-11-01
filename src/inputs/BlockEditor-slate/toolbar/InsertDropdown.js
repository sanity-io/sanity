import React, {PropTypes} from 'react'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'

export default class InsertDropdown extends React.Component {

  static propTypes = {
    onInsertBlock: PropTypes.func,
    blocks: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        title: PropTypes.string
      })
    )
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
