import React, {PropTypes} from 'react'
import ReactDOM from 'react-dom'
import FormBuilderPropTypes from '../FormBuilderPropTypes'

import {ProseMirror} from 'prosemirror'

import 'prosemirror/dist/menu/menubar'
import 'prosemirror/dist/inputrules/autoinput'
import {parseFrom, serializeTo} from 'prosemirror/dist/format'
import {defaultSchema} from 'prosemirror/dist/model'

class ProseMirrorValueContainer {
  constructor(doc) {
    this.doc = doc
  }

  patch(patch) {
    console.log('received patch for document: ', patch)
    /* this.doc.transform( ... ) */
    return new ProseMirrorValueContainer(this.doc)
  }

  unwrap() {
    return serializeTo(this.doc, 'html')
  }
}

ProseMirrorValueContainer.wrap = function wrap(htmlValue) {
  console.log('WRAP', htmlValue)
  return new ProseMirrorValueContainer(parseFrom(defaultSchema, htmlValue || '', 'html'))
}

export default React.createClass({

  propTypes: {
    field: FormBuilderPropTypes.field.isRequired,
    defaultValue: PropTypes.string,
    value: PropTypes.object,
    onChange: PropTypes.func
  },

  statics: {
    container: ProseMirrorValueContainer
  },

  getDefaultProps() {
    return {
      onChange() {}
    }
  },

  componentWillMount() {
    this._prosemirror = new ProseMirror({
      menuBar: true
    })
  },

  componentDidMount() {
    ReactDOM.findDOMNode(this).appendChild(this._prosemirror.wrapper)
    if (this.props.value) {
      this.setContent(this.props.value.doc)
    }

    this._prosemirror.on('transform', this.handleProseMirrorTransform)
  },

  componentDidUpdate({options: previous}) {
  },

  componentWillUnmount() {
    this._prosemirror.off('change', this.handleProseMirrorTransform)
  },

  handleProseMirrorTransform(transform) {
    // todo: figure out how this patch should be
    const steps = []
    const maps = []
    for (let i = 0; i < transform.steps.length; i++) {
      steps.push(transform.steps[i])
      maps.push(transform.maps[i])
    }

    this.props.onChange({
      patch: {
        $maps: maps,
        $steps: steps
      }
    })
  },

  render() {
    return <div />
  }
})
