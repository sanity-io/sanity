import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/selects/default'
import {uniqueId} from 'lodash'
import FaAngleDown from 'react-icons/lib/fa/angle-down'
import FormField from 'component:@sanity/components/formfields/default'

export default class DefaultSelect extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    value: PropTypes.object,
    error: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    hasFocus: PropTypes.bool,
    showClearButton: PropTypes.bool,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
      })
    ),
  }

  static defaultProps = {
    value: '',
    onChange() {},
    onBlur() {}
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.hasFocus != this.props.hasFocus) {
      this.handleFocus()
    }
  }

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.state = {
      hasFocus: false
    }
  }

  handleFocus() {
    this.setState({
      hasFocus: true
    })
    this.props.onFocus()
  }

  handleBlur() {
    this.setState({
      hasFocus: false
    })
    this.props.onBlur()
  }

  handleChange(event) {
    this.props.onChange(this.props.items[event.target.value])
  }

  componentWillMount() {
    this._inputId = uniqueId('DefaultTextField')
  }

  render() {
    const {label, error, items, value} = this.props
    const {hasFocus} = this.state

    const rootClass = error ? styles.error : styles.root

    return (
      <FormField className={`${rootClass} ${hasFocus && styles.focused}`} label={label} labelHtmlFor={this._inputId}>
        <div className={styles.selectContainer}>
          <select
            className={styles.select}
            id={this._inputId}
            onChange={this.handleChange}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            value={items.indexOf(value)}
          >
            {
              items.map((item, i) => {
                return (
                  <option key={i} value={i}>{item.title}</option>
                )
              })
            }
          </select>
          <div className={styles.icon}>
            <FaAngleDown color="inherit" />
          </div>
        </div>
      </FormField>
    )
  }
}
