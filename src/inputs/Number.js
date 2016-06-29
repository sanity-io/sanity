import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import styles from './styles/Number.css'

export default class Num extends React.Component {
  static displayName = 'Number';

  static propTypes = {
    field: FormBuilderPropTypes.field,
    value: PropTypes.number,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  };

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(e) {
    const val = e.target.value.trim()
    this.props.onChange({patch: {$set: val === '' ? undefined : Number(e.target.value)}})
  }

  render() {
    const {value} = this.props
    return (
      <div className={styles.root}>
        <input
          type="number"
          className={styles.input}
          onChange={this.handleChange}
          placeholder="Must be a number ex. 123"
          value={value || ''}
        />
      </div>
    )
  }
}
