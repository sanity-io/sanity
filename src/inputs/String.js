import ClearButton from '../buttons/ClearButton'
import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import equals from 'shallow-equals'
import styles from './styles/String.css'

export default class Str extends React.Component {
  static displayName = 'String';

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    value: PropTypes.string,
    validation: PropTypes.shape({
      messages: PropTypes.array
    }),
    focus: PropTypes.bool,
    onChange: PropTypes.func,
    onEnter: PropTypes.func,
  };

  static defaultProps = {
    value: '',
    onChange() {},
    onEnter() {}
  };

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.setInputElement = this.setInputElement.bind(this)
  }

  setInputElement(element) {
    this.inputElement = element
  }

  componentDidMount() {
    if (this.props.focus) {
      this.focus()
    }
  }
  shouldComponentUpdate(nextProps) {
    return !equals(this.props, nextProps)
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.focus && this.props.focus) {
      this.focus()
    }
  }

  focus() {
    this.inputElement.focus()
  }

  handleChange(e) {
    const val = e.target.value || undefined
    const op = val ? '$set' : '$delete'
    this.props.onChange({patch: {[op]: val}})
  }

  handleKeyPress(e) {
    if (e.key === 'Enter') {
      this.props.onEnter()
    }
  }

  render() {
    const {value, field, validation} = this.props

    const rootClass = validation && validation.messages && validation.messages.length > 0 ? styles.error : styles.root
    const inputClass = validation && validation.messages && validation.messages.length > 0 ? styles.inputError : styles.input

    return (
      <div className={rootClass}>
        <label>{field.title}</label>
        <div className={styles.inner}>

          {
            value && <ClearButton className={styles.clearButton} />
          }

          <input
            className={inputClass}
            type="text"
            placeholder={field.placeholder}
            onChange={this.handleChange}
            onKeyPress={this.handleKeyPress}
            value={value}
            ref={this.setInputElement}
          />
        </div>
      </div>
    )
  }
}
