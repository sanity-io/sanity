import ClearButton from '../buttons/ClearButton'
import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import {eq} from 'lodash'
import styles from './styles/String.css'


export default class extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.handleChange = this.handleChange.bind(this);
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

  shouldComponentUpdate(nextProps) {
    return !eq(this.props, nextProps)
  }

  handleChange(e) {
    this.props.onChange({patch: {$set: e.target.value}})
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
};
