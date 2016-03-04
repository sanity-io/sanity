import React, {PropTypes} from 'react'
import ReactDOM from 'react-dom'
import FormBuilderPropTypes from '../FormBuilderPropTypes'

import {ProseMirror} from 'prosemirror'

import 'prosemirror/dist/menu/menubar'
import 'prosemirror/dist/inputrules/autoinput'
import {parseFrom, serializeTo} from 'prosemirror/dist/format'
import {defaultSchema} from 'prosemirror/dist/model'

export default React.createClass({

  propTypes: {
    field: FormBuilderPropTypes.field.isRequired,
    defaultValue: PropTypes.string,
    value: PropTypes.object,
    onChange: PropTypes.func
  },

  statics: {
    valueContainer: {
      wrap(htmlValue) {
        return parseFrom(defaultSchema, htmlValue, 'html')
      },
      unwrap(doc) {
        return serializeTo(doc, 'html')
      }
    }
  },

  componentWillMount() {
    const {value, defaultValue} = this.props
    this._lastValue = value || defaultValue
    this._prosemirror = new ProseMirror({
      menuBar: true
    })
  },

  componentDidMount() {
    ReactDOM.findDOMNode(this).appendChild(this._prosemirror.wrapper)
    this.setContent(this.props.value)
    this._prosemirror.on('change', this.handleProseMirrorChange)
  },

  shouldComponentUpdate() {
    return false
  },

  componentWillUpdate(nextProps) {
    if ('value' in nextProps) {
      const value = nextProps.value
      if (value !== this._lastValue) {
        this.setContent(value)
      }
    }
  },

  componentDidUpdate({options: previous}) {
  },

  componentWillUnmount() {
    this._prosemirror.off('change', this.handleProseMirrorChange)
  },

  setContent(value) {
    this._prosemirror.setContent(value)
  },
  handleProseMirrorChange() {
    const {onChange} = this.props
    if (onChange) {
      this._lastValue = this._prosemirror.getContent()
      onChange(this._lastValue)
    }
  },

  render() {
    return <div />
  }
})
