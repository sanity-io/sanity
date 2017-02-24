import React, {PropTypes} from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import styles from './styles.css'

const set = value => ({type: 'set', value})
const unset = () => ({type: 'unset'})
const createPatch = value => ({patch: value === '' ? unset() : set(Number(value))})

export default class Slider {
  static propTypes = {
    type: PropTypes.shape({
      title: PropTypes.string
    }).isRequired,
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
  };

  render() {
    const {type, value, onChange} = this.props
    return (
      <FormField label={type.title} description={type.description}>
        <input
          type="range"
          className={styles.slider}
          value={value}
          onChange={event => onChange(createPatch(event.target.value))}
        />
      </FormField>
    )
  }
}
