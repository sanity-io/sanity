import React, {PropTypes} from 'react'

// Just an idea
function fromInput(Component) {
  return class extends React.Component {
    static displayName = Component.name || 'FromInput';
    static propTypes = {
      onChange: PropTypes.func,
      value: PropTypes.string,
    };

    constructor(...args) {
      super(...args)
      this.handleChange = this.handleChange.bind(this)
    }

    handleChange(ev) {
      this.props.onChange({patch: {type: 'set', value: ev.currentTarget.value.trim() || undefined}})
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
