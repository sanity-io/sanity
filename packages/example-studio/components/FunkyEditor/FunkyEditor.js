import PropTypes from 'prop-types'
import React from 'react'
import SlateEditor from '@sanity/form-builder/lib/inputs/BlockEditor-slate'
export default class FunkyEditor extends React.Component {
  static propTypes = {
    type: PropTypes.shape({
      title: PropTypes.string
    }).isRequired,
    level: PropTypes.number,
    value: PropTypes.array,
    onChange: PropTypes.func.isRequired
  };

  handleChange = event => {
    this.props.onChange(event)
  }

  render() {
    const {type, value, level} = this.props
    return (
      <div>
        <h3>Take me to Funky Town</h3>
        <SlateEditor
          type={type}
          level={level}
          value={value === undefined ? '' : value}
          onChange={this.handleChange}
        />
      </div>
    )
  }
}
