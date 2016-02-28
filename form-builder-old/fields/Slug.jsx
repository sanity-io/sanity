/* global document */
import React from 'react'
import ControlledValue from '../../../widgets/mixins/ControlledValue'
import FieldErrors from '../FieldErrors'
import slugify from '../../../lib/utils/slugify'

// Todo: remove this
function getCaretPos(el) {
  if (!el.createTextRange) {
    return el.selectionStart
  }
  const range = document.selection.createRange().duplicate()
  range.moveEnd('character', el.value.length)
  if (range.text == '') {
    return el.value.length
  }
  return el.value.lastIndexOf(range.text)
}

function setCaretPos(ctrl, pos) {
  if (ctrl.setSelectionRange) {
    ctrl.focus()
    ctrl.setSelectionRange(pos, pos)
  }
  else if (ctrl.createTextRange) {
    const range = ctrl.createTextRange()
    range.collapse(true)
    range.moveEnd('character', pos)
    range.moveStart('character', pos)
    range.select()
  }
}

export default React.createClass({
  displayName: 'SlugField',
  mixins: [ControlledValue],

  getInitialState() {
    return {}
  },
  getValueOrDefault(props) {
    return this._getValue() || slugify(props.document[props.field.source])
  },
  handleChange(e) {
    if (e.target.value !== slugify(e.target.value)) {
      this.setState({restoreCaretAt: getCaretPos(e.target) - 1})
      return
    }
    this.setState({restoreCaretAt: null})
    this._setValue(slugify(e.target.value))
  },
  componentDidUpdate(prevProps, prevState) {
    if (this.state.restoreCaretAt) {
      setCaretPos(this.refs.input, this.state.restoreCaretAt)
    }
  },
  render() {
    const {className} = this.props
    return (
      <div className="form-builder__field form-builder__slug">
        <label className="form-builder__label form-builder__label--default">
          {this.props.field.title}
        </label>
        {
          this.props.field.description &&
          <div className='form-builder__help-text'>{this.props.field.description}</div>
        }
        <div className='form-builder__item'>
          <input
            ref="input"
            className={className + ' form-control'}
            type="text"
            value={this.getValueOrDefault(this.props)}
            onChange={this.handleChange}
            />
        </div>
        <FieldErrors errors={this.props.errors}/>
      </div>
    )
  }
})
