import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import styles from './styles/Number.css'

export default class Num extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
  }

  static propTypes = {
    field: FormBuilderPropTypes.field,
    value: PropTypes.number,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  };

  handleChange(e) {
    const val = e.target.value.trim()
    this.props.onChange({patch: {$set: val === '' ? void 0 : Number(e.target.value)}})
  }

  render() {
    const {value} = this.props
    return (
      <div className={styles.root}>
        <input className={styles.input} type="number"
          onChange={this.handleChange}
          value={value}
        />
      </div>
    )
  }
}
