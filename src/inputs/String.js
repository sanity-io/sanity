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
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: '',
    onChange() {}
  };

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
  }

  shouldComponentUpdate(nextProps) {
    return !equals(this.props, nextProps)
  }

  handleChange(e) {
    const val = e.target.value.trim() || void 0
    console.log(val)
    this.props.onChange({patch: {$set: val}})
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
            value={value}
          />
        </div>
      </div>
    )
  }
}
