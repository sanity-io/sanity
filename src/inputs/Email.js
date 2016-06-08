import ClearButton from '../buttons/ClearButton'
import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import styles from './styles/Email.css'

export default class extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
  }

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: '',
    onChange() {}
  };

  handleChange(event) {
    this.props.onChange({$set: event.target.value})
  }

  render() {
    const {value, field} = this.props
    return (
      <div className={styles.root}>
        <div className={styles.inner}>
          <ClearButton className={styles.clearButton} />
          <input className={styles.input} type="email" field={field} value={value} onChange={this.handleChange} />
        </div>
      </div>
    )
  }
}
