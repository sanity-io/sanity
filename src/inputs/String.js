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
  }

  shouldComponentUpdate(nextProps) {
    return !equals(this.props, nextProps)
  }

  handleChange(e) {
    const val = e.target.value || undefined
    this.props.onChange({patch: {$set: val}})
  }

  handleKeyPress(e) {
    if (e.key === 'Enter') {
      this.props.onEnter()
    }
  }

  render() {
    const {value, field} = this.props
    return (
      <div className={styles.root}>
        <div className={styles.inner}>
          <ClearButton className={styles.clearButton} />
          <input
            className={styles.input}
            type="text"
            placeholder={field.placeholder}
            onChange={this.handleChange}
            onKeyPress={this.handleKeyPress}
            value={value}
          />
        </div>
      </div>
    )
  }
}
