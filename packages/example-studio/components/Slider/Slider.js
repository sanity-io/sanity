import React, {PropTypes} from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import styles from './styles.css'

const set = value => ({type: 'set', value})
const unset = () => ({type: 'unset'})
const createPatch = value => ({patch: value === '' ? unset() : set(Number(value))})

export default class Slider extends React.Component {
  static propTypes = {
    type: PropTypes.shape({
      title: PropTypes.string
    }).isRequired,
    value: PropTypes.number,
    onChange: PropTypes.func.isRequired
  };

  render() {
    const {type, value, onChange} = this.props
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
          onChange={event => onChange(createPatch(event.target.value))}
        />
      </FormField>
    )
  }
}
