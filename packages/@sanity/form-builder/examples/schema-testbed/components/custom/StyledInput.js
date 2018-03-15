import PropTypes from 'prop-types'
import React from 'react'
import PatchEvent, {set, unset} from '../../../../src/PatchEvent'

function defaultGeneratePatch(inputValue) {
  return inputValue === '' ? unset() : set(inputValue)
}

// Just an idea
function fromInput(Component, generatePatch = defaultGeneratePatch) {
  return class extends React.Component {
    static displayName = Component.name || 'FromInput'
    static propTypes = {
      onChange: PropTypes.func,
      value: PropTypes.string
    }

    handleChange = event => {
      this.props.onChange(PatchEvent.from(generatePatch(event.target.value)))
    }

    render() {
      const {value, ...rest} = this.props
      return <Component {...rest} value={value || ''} onChange={this.handleChange} />
    }
  }
}

export default fromInput(props => {
  const {value, onChange, type} = props
  const {style = {}} = type.options
  return (
    <div>
      <h2>{type.title}</h2>
      <input type="text" style={style} value={value} onChange={onChange} />
    </div>
  )
})
