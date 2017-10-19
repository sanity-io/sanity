import React, {Component} from 'react'
import PropTypes from 'prop-types'

const sizerStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  visibility: 'hidden',
  height: 0,
  overflow: 'scroll',
  whiteSpace: 'pre',
}

class AutosizeInput extends Component {
  constructor(props) {
    super(props)
    this.state = {
      inputWidth: props.minWidth,
      inputId: `_${Math.random().toString(36).substr(2, 12)}`,
    }
  }
  componentDidMount() {
    this.mounted = true
    this.copyInputStyles()
    this.updateInputWidth()
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevState.inputWidth !== this.state.inputWidth) {
      if (typeof this.props.onAutosize === 'function') {
        this.props.onAutosize(this.state.inputWidth)
      }
    }
    this.updateInputWidth()
  }
  componentWillUnmount() {
    this.mounted = false
  }
  inputRef = el => {
    this.input = el
    if (typeof this.props.inputRef === 'function') {
      this.props.inputRef(el)
    }
  }
  placeHolderSizerRef = el => {
    this.placeHolderSizer = el
  }
  sizerRef = el => {
    this.sizer = el
  }
  copyInputStyles() {
    if (!this.mounted || !window.getComputedStyle) {
      return
    }
    const inputStyle = this.input && window.getComputedStyle(this.input)
    if (!inputStyle) {
      return
    }
    const widthNode = this.sizer
    widthNode.style.fontSize = inputStyle.fontSize
    widthNode.style.fontFamily = inputStyle.fontFamily
    widthNode.style.fontWeight = inputStyle.fontWeight
    widthNode.style.fontStyle = inputStyle.fontStyle
    widthNode.style.letterSpacing = inputStyle.letterSpacing
    widthNode.style.textTransform = inputStyle.textTransform
    if (this.props.placeholder) {
      const placeholderNode = this.placeHolderSizer
      placeholderNode.style.fontSize = inputStyle.fontSize
      placeholderNode.style.fontFamily = inputStyle.fontFamily
      placeholderNode.style.fontWeight = inputStyle.fontWeight
      placeholderNode.style.fontStyle = inputStyle.fontStyle
      placeholderNode.style.letterSpacing = inputStyle.letterSpacing
      placeholderNode.style.textTransform = inputStyle.textTransform
    }
  }
  updateInputWidth() {
    if (!this.mounted || !this.sizer || typeof this.sizer.scrollWidth === 'undefined') {
      return
    }
    let newInputWidth
    if (this.props.placeholder && (!this.props.value || (this.props.value && this.props.placeholderIsMinWidth))) {
      newInputWidth = Math.max(this.sizer.scrollWidth, this.placeHolderSizer.scrollWidth) + 2
    } else {
      newInputWidth = this.sizer.scrollWidth + 2
    }
    if (newInputWidth < this.props.minWidth) {
      newInputWidth = this.props.minWidth
    }
    if (newInputWidth !== this.state.inputWidth) {
      this.setState({
        inputWidth: newInputWidth,
      })
    }
  }
  getInput() {
    return this.input
  }
  focus() {
    this.input.focus()
  }
  blur() {
    this.input.blur()
  }
  select() {
    this.input.select()
  }
  render() {
    const sizerValue = [this.props.defaultValue, this.props.value, ''].reduce((previousValue, currentValue) => {
      if (previousValue !== null && previousValue !== undefined) {
        return previousValue
      }
      return currentValue
    })

    const wrapperStyle = {...this.props.style}
    if (!wrapperStyle.display) {
      wrapperStyle.display = 'inline-block'
    }
    const inputStyle = {...this.props.inputStyle}
    inputStyle.width = `${this.state.inputWidth}px`
    inputStyle.boxSizing = 'content-box'
    const {...inputProps} = this.props
    inputProps.className = this.props.inputClassName
    inputProps.style = inputStyle
    // ensure props meant for `AutosizeInput` don't end up on the `input`
    delete inputProps.inputClassName
    delete inputProps.inputStyle
    delete inputProps.minWidth
    delete inputProps.onAutosize
    delete inputProps.placeholderIsMinWidth
    delete inputProps.inputRef
    return (
      <div className={this.props.className} style={wrapperStyle}>
        <style
          dangerouslySetInnerHTML={{
            __html: [`input#${this.state.id}::-ms-clear {display: none;}`].join('\n'),
          }}
        />
        <input id={this.state.id} {...inputProps} ref={this.inputRef} />
        <div ref={this.sizerRef} style={sizerStyle}>{sizerValue}</div>
        {this.props.placeholder
          ? <div ref={this.placeHolderSizerRef} style={sizerStyle}>{this.props.placeholder}</div>
          : null
        }
      </div>
    )
  }
}

AutosizeInput.propTypes = {
  className: PropTypes.string, // className for the outer element
  defaultValue: PropTypes.any, // default field value
  inputClassName: PropTypes.string, // className for the input element
  inputRef: PropTypes.func, // ref callback for the input element
  inputStyle: PropTypes.object, // css styles for the input element
  minWidth: PropTypes.oneOfType([ // minimum width for input element
    PropTypes.number,
    PropTypes.string,
  ]),
  onAutosize: PropTypes.func, // onAutosize handler: function(newWidth) {}
  onChange: PropTypes.func, // onChange handler: function(newValue) {}
  placeholder: PropTypes.string, // placeholder text
  placeholderIsMinWidth: PropTypes.bool, // don't collapse size to less than the placeholder
  style: PropTypes.object, // css styles for the outer element
  value: PropTypes.any, // field value
}
AutosizeInput.defaultProps = {
  minWidth: 1,
}

export default AutosizeInput
