import React, {PropTypes} from 'react'
import ReactDOM from 'react-dom'
import FormBuilderPropTypes from '../FormBuilderPropTypes'

import {ProseMirror} from 'prosemirror'

import 'prosemirror/dist/menu/menubar'
import 'prosemirror/dist/inputrules/autoinput'
import {parseFrom, serializeTo} from 'prosemirror/dist/format'
import {defaultSchema, Node} from 'prosemirror/dist/model'

const EMPTY_VALUE = defaultSchema.node('doc', null, defaultSchema.node('paragraph'))

// Just a rudimentary value container for prosemirror-produced html. Not meant for production.
class ProseMirrorValueContainer {
  static deserialize(htmlValue, context) {
    const doc = htmlValue ? parseFrom(defaultSchema, htmlValue, 'html') : EMPTY_VALUE
    return new ProseMirrorValueContainer(doc, context)
  }

  constructor(doc, context) {
    this.doc = doc
    this.context = context
  }

  validate() {
    const {field} = this.context

    const messages = field.required && this.isEmpty()
      ? [{id: 'errors.fieldIsRequired', type: 'error', message: 'Field is required'}]
      : []

    return {messages}
  }

  isEmpty() {
    // this is not very nice. figure out a more robust way of checking if document is empty
    return this.doc === EMPTY_VALUE || serializeTo(this.doc, 'text') === ''
  }

  patch(patch) {
    // console.log('received patch for document: ', patch)
    /* this.doc.transform( ... ) */
    if (!patch.$setDoc || !(patch.$setDoc instanceof Node)) {
      throw new Error('The only allowed patch operation are $setDoc and its value must be a new ProseMirror document')
    }

    return new ProseMirrorValueContainer(patch.$setDoc, this.context)
  }

  serialize() {
    return this.isEmpty() ? undefined : serializeTo(this.doc, 'html')
  }
}

export default class RichTextProsemirror extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.handleProseMirrorTransform = this.handleProseMirrorTransform.bind(this)
  }

  static valueContainer = ProseMirrorValueContainer;

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    defaultValue: PropTypes.string,
    value: PropTypes.instanceOf(ProseMirrorValueContainer),
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  };

  componentWillMount() {
    this._prosemirror = new ProseMirror({
      menuBar: true
    })
  }

  componentDidMount() {
    ReactDOM.findDOMNode(this).appendChild(this._prosemirror.wrapper)
    if (this.props.value) {
      this.setContent(this.props.value.doc)
    }

    this._prosemirror.on('transform', this.handleProseMirrorTransform)
  }

  componentDidUpdate(prevProps) {
    if (this.props.value.doc !== this._prosemirror.doc) {
      this._prosemirror.setDoc(this.props.value.doc)
    }
  }
  componentWillUnmount() {
    this._prosemirror.off('change', this.handleProseMirrorTransform)
  }

  setContent(doc) {
    this._prosemirror.setContent(doc)
  }

  handleProseMirrorTransform(transform) {
    this.props.onChange({patch: {$setDoc: this._prosemirror.doc}})
    // todo: figure out how this patch should be
    // const steps = []
    // const maps = []
    // for (let i = 0; i < transform.steps.length; i++) {
    //   steps.push(transform.steps[i])
    //   maps.push(transform.maps[i])
    // }
    //
    // this.props.onChange({
    //   patch: {
    //     $maps: maps,
    //     $steps: steps
    //   }
    // })
  }

  render() {
    return <div />
  }
}
