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
    this.props.onChange({patch: {$set: val === '' ? void 0 : Number(e.target.value)}})
  }

  render() {
    const {value} = this.props
    return (
      <div className={styles.root}>
        <input
          type="number"
          className={styles.input}
          onChange={this.handleChange}
          value={value}
        />
      </div>
    )
  }
}
