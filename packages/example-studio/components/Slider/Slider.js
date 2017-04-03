import React, {PropTypes} from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import PatchEvent, {set, unset} from '@sanity/form-builder/PatchEvent'
import styles from './styles.css'

export default class Slider extends React.Component {
  static propTypes = {
    type: PropTypes.shape({
      title: PropTypes.string
    }).isRequired,
    value: PropTypes.number,
    onChange: PropTypes.func.isRequired
  };

  handleChange = event => {
    const inputValue = event.target.value
    const patch = inputValue === '' ? unset() : set(Number(inputValue))
    this.props.onChange(PatchEvent.from(patch))
  }

  render() {
    const {type, value} = this.props
    const {min, max, step} = type.options.range
    return (
      <FormField label={type.title} description={type.description}>
        <input
          type="range"
          className={styles.slider}
          min={min}
          max={max}
          step={step}
          value={value === undefined ? '' : value}
          onChange={this.handleChange}
        />
      </FormField>
    )
  }
}
