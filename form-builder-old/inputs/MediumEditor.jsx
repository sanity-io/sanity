import React from 'react'
import ControlledValue from '../mixins/ControlledValue'
import MediumEditor from 'medium-editor'
import _t from '../../lib/translate'._t

const supportedActions = [
  'bold', 'italic', 'underline', 'strikethrough', 'subscript',
  'superscript', 'anchor', 'quote', 'pre', 'orderedlist', 'unorderedlist', 'indent',
  'outdent', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'removeFormat'
]
const headers = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

export default React.createClass({

  propTypes: {
    onBlur: React.PropTypes.func,
    onChange: React.PropTypes.func,
    value: React.PropTypes.string,
    placeholder: React.PropTypes.string,
    config: React.PropTypes.object
  },

  mixins: [ControlledValue],

  componentDidMount() {
    this._editor = new MediumEditor(this.refs.editor, this.compileEditorOptions())
  },

  compileEditorOptions() {
    // https://github.com/yabwe/medium-editor#toolbar-options
    const config = this.props.config || {}
    const actions = config.actions || [
      'bold', 'italic', 'underline', 'anchor', 'h1', 'h2', 'quote', 'orderedlist', 'unorderedlist', 'removeFormat'
    ]

    const toolbarButtons = actions.map(buttonAction => {
      if (!supportedActions.includes(buttonAction)) {
        return null
      }
      const buttonConfig = {
        name: buttonAction,
        aria: _t('editor.button.' + buttonAction + '.tooltip')
      }
      const override = config.overrideElements ? config.overrideElements[buttonAction] : null
      if (override && override.preferredElement && headers.includes(buttonAction)) {
        // rewrite action for header elements only
        buttonConfig.action = 'append-' + override.preferredElement
        buttonConfig.aria = _t('editor.button.' + override.preferredElement + '.tooltip')
      }
      if (buttonAction == 'anchor') {
        // show an ion-link instead of the default '#'
        buttonConfig.contentDefault = '<i class="ion ion-link"></i>'
      }
      if (override && override.caption) {
        // override with whatever caption the config dictates
        buttonConfig.contentDefault = override.caption
      }
      if (override && override.tooltip) {
        // override with whatever tooltip the config dictates
        buttonConfig.aria = override.tooltip
      }
      return buttonConfig
    })
      .filter(Boolean)

    return {
      toolbar: {
        buttons: toolbarButtons,
        static: true,
        align: 'right',
        sticky: true,
        updateOnEmptySelection: true
      },
      imageDragging: false,
      placeholder: {
        text: this.props.placeholder || ''
      },
      anchor: {
        linkValidation: true,
        targetCheckbox: true
      },
      paste: {
        forcePlainText: true,
        cleanPastedHTML: true
      },
      disableReturn: false,
      autoLink: true,
      disableDoubleReturn: false
    }
  },

  componentWillUnmount() {
    this._editor.destroy()
  },

  _getEditorvalue() {
    const serialized = this._editor.serialize()
    return Object.keys(serialized).map((key) => serialized[key].value).join('\n')
  },

  handleInput() {
    const value = this._getEditorvalue()
    this._setValue(value === '<br>' ? '' : value)
  },

  handleBlur() {
    if (this.props.onBlur) {
      this.props.onBlur()
    }
  },

  shouldComponentUpdate() {
    return false
  },

  componentWillReceiveProps(nextProps) {
    const isInvalid = (nextProps.className || '').split(' ').includes('invalid')
    this._editor.elements.map(el => el.classList[isInvalid ? 'add' : 'remove']('invalid'))
  },

  render() {
    const value = this._getValue() || '<br>'
    const {style, size = 'medium', className} = this.props
    return (
      <div className="rich-text">
        <div className="rich-text__wrapper">
          <div
            ref="editor"
            style={style}
            className={`medium-editor rich-text__editor form-control rich-text__editor--${size} ${className || ''}`}
            onBlur={this.handleBlur}
            dangerouslySetInnerHTML={{__html: value}}
            onKeyUp={this.handleInput}
            onInput={this.handleInput}
            name={this.props.name}
          />
        </div>
      </div>
    )
  }
})
