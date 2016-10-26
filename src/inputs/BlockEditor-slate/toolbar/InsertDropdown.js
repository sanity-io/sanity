import React, {PropTypes} from 'react'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'

export default class InsertDropdown extends React.Component {

  static propTypes = {
    groupedFields: PropTypes.object,
    onInsertBlock: PropTypes.func
  }

  render() {
    const {groupedFields} = this.props
    const items = groupedFields.formBuilder.map(ofField => {
      return {
        type: ofField.type,
        title: ofField.title,
        //disabled: this.isWithinList()
      }
    })
    return (
      <DropDownButton items={items} onAction={this.props.onInsertBlock} kind="simple">
        Insert
      </DropDownButton>
    )
  }
}
