import React from 'react'
import DefaultString from './string/DefaultString'
import SelectStyleString from './string/SelectStyleString'
import RadioStyleString from './string/RadioStyleString'
import StaticStyleString from './string/StaticStyleString'


export default React.createClass({

  displayName: 'String',

  propTypes: {
    field: React.PropTypes.shape({
      of: React.PropTypes.arrayOf(
        React.PropTypes.shape({
          text: React.PropTypes.string,
          value: React.PropTypes.string
        })
      ),
      style: React.PropTypes.oneOf(['radio', 'select', 'static']),
      placeholder: React.PropTypes.string
    })
  },

  getStringComponent() {
    const {field} = this.props

    if (!field || !field.style) {
      return DefaultString
    }

    switch (field.style) {
      case 'radio':
        return RadioStyleString
      case 'select':
        return SelectStyleString
      case 'static':
        return StaticStyleString
      default:
        return DefaultString
    }

  },

  focus() {
    if (this.refs.stringImplementation &&
        this.refs.stringImplementation.focus) {
      this.refs.stringImplementation.focus()
    }
  },

  render() {
    const StringComponent = this.getStringComponent()

    return <StringComponent ref='stringImplementation' {...this.props}/>
  }

})
