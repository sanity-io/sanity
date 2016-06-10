import ClearButton from '../buttons/ClearButton'
import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import equals from 'shallow-equals'
import styles from './styles/Text.css'


export default class Str extends React.Component {
  static displayName = 'Text';

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
    const val = e.target.value || undefined
    this.props.onChange({patch: {$set: val}})
  }

  render() {
    const {value, field} = this.props
    return (
      <div className={styles.root}>
        <div className={styles.inner}>
          <ClearButton className={styles.clearButton} />
          <textarea
            className={styles.textarea}
            placeholder={field.placeholder}
            onChange={this.handleChange}
            rows={field.rows || 10}
            value={value}
          >
          </textarea>
        </div>
      </div>
    )
  }
}
