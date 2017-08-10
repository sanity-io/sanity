import React from 'react'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import Preview from '../../Preview'

export default class Item extends React.PureComponent {
  handleChange = event => {
    const {onChange, value} = this.props
    onChange(event.target.checked, value)
  }

  render() {
    const {value, checked, type} = this.props
    return (
      <Checkbox
        onChange={this.handleChange}
        checked={checked}
      >
        <Preview type={type} value={value} />
      </Checkbox>
    )
  }
}
